begin;

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references auth.users(id) on delete cascade,
  artist_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete set null,
  order_request_id uuid references public.order_requests(id) on delete set null,
  last_message text,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (buyer_id <> artist_id)
);

create unique index if not exists conversations_order_request_unique_idx
  on public.conversations(order_request_id)
  where order_request_id is not null;
create unique index if not exists conversations_listing_participants_unique_idx
  on public.conversations(buyer_id, artist_id, listing_id)
  where listing_id is not null and order_request_id is null;
create unique index if not exists conversations_general_participants_unique_idx
  on public.conversations(buyer_id, artist_id)
  where listing_id is null and order_request_id is null;
create index if not exists conversations_buyer_activity_idx
  on public.conversations(buyer_id, last_message_at desc);
create index if not exists conversations_artist_activity_idx
  on public.conversations(artist_id, last_message_at desc);

alter table public.messages
  add column if not exists conversation_id uuid,
  add column if not exists message_type text not null default 'text',
  add column if not exists is_read boolean not null default false;

insert into public.conversations (
  buyer_id,
  artist_id,
  listing_id,
  order_request_id,
  last_message,
  last_message_at,
  created_at
)
select
  order_requests.buyer_id,
  order_requests.creator_id,
  order_requests.listing_id,
  order_requests.id,
  latest.body,
  coalesce(latest.created_at, order_requests.created_at),
  order_requests.created_at
from public.order_requests
left join lateral (
  select messages.body, messages.created_at
  from public.messages
  where messages.order_request_id = order_requests.id
  order by messages.created_at desc
  limit 1
) latest on true
on conflict (order_request_id) where order_request_id is not null do nothing;

update public.messages
set conversation_id = conversations.id
from public.conversations
where public.messages.conversation_id is null
  and conversations.order_request_id = public.messages.order_request_id;

do $$
begin
  if exists (select 1 from public.messages where conversation_id is null) then
    raise exception 'Some legacy messages could not be linked to a conversation';
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'messages_conversation_id_fkey'
      and conrelid = 'public.messages'::regclass
  ) then
    alter table public.messages
      add constraint messages_conversation_id_fkey
      foreign key (conversation_id) references public.conversations(id) on delete cascade;
  end if;
end;
$$;

alter table public.messages alter column conversation_id set not null;
alter table public.messages alter column recipient_id drop not null;
alter table public.messages alter column order_request_id drop not null;
alter table public.messages drop constraint if exists messages_sender_id_fkey;
alter table public.messages
  add constraint messages_sender_id_fkey
  foreign key (sender_id) references auth.users(id) on delete cascade;

create index if not exists messages_conversation_created_at_idx
  on public.messages(conversation_id, created_at);
create index if not exists messages_unread_idx
  on public.messages(conversation_id, is_read)
  where is_read = false;

create table if not exists public.message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  file_url text not null,
  file_type text,
  created_at timestamptz not null default now()
);
create index if not exists message_attachments_message_id_idx
  on public.message_attachments(message_id);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.message_attachments enable row level security;

drop policy if exists "Order participants can read messages" on public.messages;
drop policy if exists "Order participants can send messages" on public.messages;
drop policy if exists "Participants can read conversations" on public.conversations;
drop policy if exists "Participants can create conversations" on public.conversations;
drop policy if exists "Participants can read messages" on public.messages;
drop policy if exists "Participants can send messages" on public.messages;
drop policy if exists "Participants can mark messages read" on public.messages;
drop policy if exists "Participants can read message attachments" on public.message_attachments;
drop policy if exists "Message senders can add attachments" on public.message_attachments;

create policy "Participants can read conversations"
  on public.conversations for select
  using (auth.uid() = buyer_id or auth.uid() = artist_id);

create policy "Participants can create conversations"
  on public.conversations for insert
  with check (
    (auth.uid() = buyer_id or auth.uid() = artist_id)
    and buyer_id <> artist_id
    and exists (
      select 1 from public.profiles
      where profiles.id = conversations.buyer_id and profiles.role = 'buyer'
    )
    and exists (
      select 1 from public.profiles
      where profiles.id = conversations.artist_id and profiles.role = 'creator'
    )
    and (
      listing_id is null
      or exists (
        select 1 from public.listings
        where listings.id = conversations.listing_id
          and listings.creator_id = conversations.artist_id
      )
    )
    and (
      order_request_id is null
      or exists (
        select 1 from public.order_requests
        where order_requests.id = conversations.order_request_id
          and order_requests.buyer_id = conversations.buyer_id
          and order_requests.creator_id = conversations.artist_id
      )
    )
  );

create policy "Participants can read messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations
      where conversations.id = messages.conversation_id
        and (conversations.buyer_id = auth.uid() or conversations.artist_id = auth.uid())
    )
  );

create policy "Participants can send messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations
      where conversations.id = messages.conversation_id
        and (conversations.buyer_id = auth.uid() or conversations.artist_id = auth.uid())
    )
  );

create policy "Participants can mark messages read"
  on public.messages for update
  using (
    exists (
      select 1 from public.conversations
      where conversations.id = messages.conversation_id
        and (conversations.buyer_id = auth.uid() or conversations.artist_id = auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.conversations
      where conversations.id = messages.conversation_id
        and (conversations.buyer_id = auth.uid() or conversations.artist_id = auth.uid())
    )
  );

create policy "Participants can read message attachments"
  on public.message_attachments for select
  using (
    exists (
      select 1
      from public.messages
      join public.conversations on conversations.id = messages.conversation_id
      where messages.id = message_attachments.message_id
        and (conversations.buyer_id = auth.uid() or conversations.artist_id = auth.uid())
    )
  );

create policy "Message senders can add attachments"
  on public.message_attachments for insert
  with check (
    exists (
      select 1
      from public.messages
      join public.conversations on conversations.id = messages.conversation_id
      where messages.id = message_attachments.message_id
        and messages.sender_id = auth.uid()
        and (conversations.buyer_id = auth.uid() or conversations.artist_id = auth.uid())
    )
  );

create or replace function public.protect_message_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (to_jsonb(new) - 'is_read') is distinct from (to_jsonb(old) - 'is_read') then
    raise exception 'Only is_read can be updated on a message';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_message_fields on public.messages;
create trigger protect_message_fields
  before update on public.messages
  for each row execute procedure public.protect_message_update();

create or replace function public.sync_conversation_last_message()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.conversations
  set last_message = new.body,
      last_message_at = new.created_at
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists sync_conversation_after_message on public.messages;
create trigger sync_conversation_after_message
  after insert on public.messages
  for each row execute procedure public.sync_conversation_last_message();

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'conversations'
  ) then
    alter publication supabase_realtime add table public.conversations;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end;
$$;

commit;
