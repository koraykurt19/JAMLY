-- Jamly badge and achievement system.
--
-- Badges are rule-bearing records, not decoration: each definition declares how
-- it is earned, whether it can be revoked, and who may grant it. Awards carry a
-- reason and an actor so the admin audit trail can explain every grant.
--
-- Idempotent: safe to re-run.

begin;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'badge_category') then
    create type public.badge_category as enum (
      'early_access',
      'verification',
      'marketplace',
      'collaboration',
      'community'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'badge_rarity') then
    create type public.badge_rarity as enum ('common', 'uncommon', 'rare', 'legendary');
  end if;

  if not exists (select 1 from pg_type where typname = 'badge_award_source') then
    create type public.badge_award_source as enum ('automatic', 'manual', 'import');
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Definitions
-- ---------------------------------------------------------------------------

create table if not exists public.badge_definitions (
  key text primary key check (key ~ '^[a-z][a-z0-9_]{2,47}$'),
  name_tr text not null,
  name_en text not null,
  description_tr text not null,
  description_en text not null,
  category public.badge_category not null,
  rarity public.badge_rarity not null default 'common',
  icon text not null default 'award',
  tone text not null default 'brand'
    check (tone in ('brand', 'success', 'gold', 'coral', 'neutral')),
  -- 'automatic' badges are granted by rule; 'manual' require an admin.
  award_source public.badge_award_source not null default 'manual',
  -- Machine-readable eligibility rule, interpreted by the badge engine.
  eligibility jsonb not null default '{}'::jsonb,
  revocable boolean not null default true,
  -- Permanent badges survive the condition that earned them (e.g. Founding Member).
  permanent boolean not null default false,
  display_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Awards
-- ---------------------------------------------------------------------------

create table if not exists public.badge_awards (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  badge_key text not null references public.badge_definitions(key) on delete cascade,
  source public.badge_award_source not null default 'automatic',
  -- Free-form provenance: which waitlist entry, which order, which review.
  eligibility_source jsonb not null default '{}'::jsonb,
  award_reason text,
  awarded_by uuid references public.profiles(id) on delete set null,
  awarded_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_by uuid references public.profiles(id) on delete set null,
  revoke_reason text,
  -- Members may hide a badge without losing it.
  is_visible boolean not null default true,
  display_order integer,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  unique (profile_id, badge_key)
);

create index if not exists badge_awards_profile_idx
  on public.badge_awards (profile_id)
  where revoked_at is null;
create index if not exists badge_awards_badge_idx on public.badge_awards (badge_key);

-- ---------------------------------------------------------------------------
-- Seed the launch badge set
-- ---------------------------------------------------------------------------

insert into public.badge_definitions (
  key, name_tr, name_en, description_tr, description_en,
  category, rarity, icon, tone, award_source, eligibility, revocable, permanent, display_order
) values
  -- Early access
  ('founding_member', 'Kurucu Üye', 'Founding Member',
   'Jamly açılmadan önce erken kayıt olan ve e-postasını doğrulayan ilk topluluk.',
   'Joined and verified before Jamly launched.',
   'early_access', 'legendary', 'crown', 'gold', 'automatic',
   '{"rule": "waitlist_verified", "max_queue_position": 1000}'::jsonb, false, true, 10),
  ('first_100', 'İlk 100', 'First 100',
   'Erken kayıt sırasında ilk 100 kişi arasında yer aldı.',
   'Among the first 100 people on the waitlist.',
   'early_access', 'legendary', 'medal', 'gold', 'automatic',
   '{"rule": "waitlist_verified", "max_queue_position": 100}'::jsonb, false, true, 5),
  ('first_1000', 'İlk 1.000', 'First 1,000',
   'Erken kayıt sırasında ilk 1.000 kişi arasında yer aldı.',
   'Among the first 1,000 people on the waitlist.',
   'early_access', 'rare', 'medal', 'brand', 'automatic',
   '{"rule": "waitlist_verified", "max_queue_position": 1000}'::jsonb, false, true, 15),
  ('early_supporter', 'Erken Destekçi', 'Early Supporter',
   'Erken kayıt döneminde Jamly''yi paylaşarak topluluğu büyüttü.',
   'Grew the community by referring others during early access.',
   'early_access', 'rare', 'heart-handshake', 'coral', 'automatic',
   '{"rule": "waitlist_referrals", "min_referrals": 3}'::jsonb, true, false, 20),
  ('beta_tester', 'Beta Test Ekibi', 'Beta Tester',
   'Kapalı beta sürecinde ürünü test etti ve geri bildirim verdi.',
   'Tested the product and reported feedback during closed beta.',
   'early_access', 'rare', 'flask-conical', 'brand', 'manual',
   '{"rule": "manual"}'::jsonb, true, false, 25),
  ('launch_creator', 'Lansman Üreticisi', 'Launch Creator',
   'Lansman haftasında ilk ilanını yayınlayan üretici.',
   'Published a listing during launch week.',
   'early_access', 'uncommon', 'rocket', 'brand', 'manual',
   '{"rule": "manual"}'::jsonb, true, false, 30),

  -- Verification
  ('verified_creator', 'Doğrulanmış Üretici', 'Verified Creator',
   'Kimliği ve üretici hesabı Jamly ekibi tarafından doğrulandı.',
   'Identity and creator account verified by the Jamly team.',
   'verification', 'rare', 'badge-check', 'brand', 'manual',
   '{"rule": "manual_verification"}'::jsonb, true, false, 40),
  ('verified_producer', 'Doğrulanmış Prodüktör', 'Verified Producer',
   'Prodüksiyon kimliği ve katalogu doğrulandı.',
   'Production identity and catalogue verified.',
   'verification', 'rare', 'badge-check', 'brand', 'manual',
   '{"rule": "manual_verification"}'::jsonb, true, false, 41),
  ('verified_artist', 'Doğrulanmış Sanatçı', 'Verified Artist',
   'Sanatçı kimliği doğrulandı.',
   'Artist identity verified.',
   'verification', 'rare', 'badge-check', 'brand', 'manual',
   '{"rule": "manual_verification"}'::jsonb, true, false, 42),
  ('verified_engineer', 'Doğrulanmış Ses Mühendisi', 'Verified Engineer',
   'Miks ve mastering yetkinliği doğrulandı.',
   'Mixing and mastering credentials verified.',
   'verification', 'rare', 'badge-check', 'brand', 'manual',
   '{"rule": "manual_verification"}'::jsonb, true, false, 43),
  ('verified_label', 'Doğrulanmış Etiket', 'Verified Label',
   'Plak şirketi veya etiket hesabı doğrulandı.',
   'Label or company account verified.',
   'verification', 'legendary', 'building-2', 'gold', 'manual',
   '{"rule": "manual_verification"}'::jsonb, true, false, 44),
  ('trusted_seller', 'Güvenilir Satıcı', 'Trusted Seller',
   'Tutarlı teslimat geçmişi ve yüksek memnuniyet ile güven kazandı.',
   'Earned trust through consistent delivery and high satisfaction.',
   'verification', 'rare', 'shield-check', 'success', 'automatic',
   '{"rule": "delivered_orders", "min_orders": 10, "min_rating": 4.5}'::jsonb, true, false, 45),

  -- Marketplace
  ('first_sale', 'İlk Satış', 'First Sale',
   'Jamly üzerindeki ilk satışını tamamladı.',
   'Completed their first sale on Jamly.',
   'marketplace', 'common', 'sparkles', 'success', 'automatic',
   '{"rule": "delivered_orders", "min_orders": 1}'::jsonb, false, true, 50),
  ('ten_sales', '10 Satış', '10 Sales',
   'On siparişi başarıyla teslim etti.',
   'Successfully delivered ten orders.',
   'marketplace', 'uncommon', 'trending-up', 'success', 'automatic',
   '{"rule": "delivered_orders", "min_orders": 10}'::jsonb, false, true, 51),
  ('hundred_sales', '100 Satış', '100 Sales',
   'Yüz siparişi başarıyla teslim etti.',
   'Successfully delivered one hundred orders.',
   'marketplace', 'legendary', 'trophy', 'gold', 'automatic',
   '{"rule": "delivered_orders", "min_orders": 100}'::jsonb, false, true, 52),
  ('top_seller', 'Öne Çıkan Satıcı', 'Top Seller',
   'Kategorisinde en çok tercih edilen üreticiler arasında.',
   'Among the most chosen creators in their category.',
   'marketplace', 'legendary', 'crown', 'gold', 'manual',
   '{"rule": "manual"}'::jsonb, true, false, 53),
  ('fast_responder', 'Hızlı Yanıt', 'Fast Responder',
   'Mesajlara tutarlı biçimde hızlı yanıt veriyor.',
   'Consistently replies to messages quickly.',
   'marketplace', 'uncommon', 'zap', 'brand', 'automatic',
   '{"rule": "response_time", "max_hours": 6}'::jsonb, true, false, 54),
  ('highly_rated', 'Yüksek Puanlı', 'Highly Rated',
   'Değerlendirmelerde tutarlı biçimde yüksek puan aldı.',
   'Consistently rated highly by buyers.',
   'marketplace', 'rare', 'star', 'gold', 'automatic',
   '{"rule": "rating", "min_rating": 4.8, "min_reviews": 5}'::jsonb, true, false, 55),
  ('repeat_favorite', 'Tekrar Tercih Edilen', 'Repeat Favorite',
   'Alıcılar bu üreticiyle tekrar tekrar çalışıyor.',
   'Buyers keep coming back to work with them again.',
   'marketplace', 'rare', 'repeat', 'coral', 'automatic',
   '{"rule": "repeat_buyers", "min_repeat": 3}'::jsonb, true, false, 56),

  -- Collaboration
  ('first_collaboration', 'İlk İş Birliği', 'First Collaboration',
   'İlk Collab projesini tamamladı.',
   'Completed their first collaboration project.',
   'collaboration', 'common', 'users', 'brand', 'automatic',
   '{"rule": "collab_projects", "min_projects": 1}'::jsonb, false, true, 60),
  ('reliable_collaborator', 'Güvenilir İş Ortağı', 'Reliable Collaborator',
   'Birden fazla Collab projesini zamanında tamamladı.',
   'Delivered multiple collaboration projects on time.',
   'collaboration', 'uncommon', 'handshake', 'success', 'automatic',
   '{"rule": "collab_projects", "min_projects": 5}'::jsonb, true, false, 61),
  ('split_completed', 'Pay Anlaşması Tamam', 'Split Completed',
   'Gelir paylaşımı anlaşmasını eksiksiz tamamladı.',
   'Completed a revenue split agreement in full.',
   'collaboration', 'uncommon', 'pie-chart', 'brand', 'automatic',
   '{"rule": "revenue_splits", "min_splits": 1}'::jsonb, false, true, 62),
  ('community_contributor', 'Topluluk Katkıcısı', 'Community Contributor',
   'Topluluğa katkısıyla öne çıktı.',
   'Recognised for contributions to the community.',
   'community', 'rare', 'heart', 'coral', 'manual',
   '{"rule": "manual"}'::jsonb, true, false, 70)
on conflict (key) do update set
  name_tr = excluded.name_tr,
  name_en = excluded.name_en,
  description_tr = excluded.description_tr,
  description_en = excluded.description_en,
  category = excluded.category,
  rarity = excluded.rarity,
  icon = excluded.icon,
  tone = excluded.tone,
  award_source = excluded.award_source,
  eligibility = excluded.eligibility,
  revocable = excluded.revocable,
  permanent = excluded.permanent,
  display_order = excluded.display_order,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.badge_definitions enable row level security;
alter table public.badge_awards enable row level security;

drop policy if exists "Badge definitions are public" on public.badge_definitions;
create policy "Badge definitions are public"
  on public.badge_definitions for select
  using (is_active or public.is_admin(auth.uid()));

drop policy if exists "Admins manage badge definitions" on public.badge_definitions;
create policy "Admins manage badge definitions"
  on public.badge_definitions for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- Visible, non-revoked awards are public: badges are social proof.
drop policy if exists "Visible badge awards are public" on public.badge_awards;
create policy "Visible badge awards are public"
  on public.badge_awards for select
  using (
    (revoked_at is null and is_visible)
    or auth.uid() = profile_id
    or public.is_admin(auth.uid())
  );

-- Members control visibility and ordering of their own badges — nothing else.
drop policy if exists "Members can restyle their badges" on public.badge_awards;
create policy "Members can restyle their badges"
  on public.badge_awards for update
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

drop policy if exists "Admins manage badge awards" on public.badge_awards;
create policy "Admins manage badge awards"
  on public.badge_awards for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- No INSERT policy for members: a user can never grant themselves a badge.

create or replace function public.protect_badge_award_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if public.is_admin(auth.uid()) then
    return new;
  end if;

  -- A member may only toggle visibility/order on their own award.
  if (to_jsonb(new) - 'is_visible' - 'display_order')
     is distinct from (to_jsonb(old) - 'is_visible' - 'display_order') then
    raise exception 'Only badge visibility can be changed' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_badge_award_fields_trigger on public.badge_awards;
create trigger protect_badge_award_fields_trigger
  before update on public.badge_awards
  for each row execute function public.protect_badge_award_fields();

-- ---------------------------------------------------------------------------
-- Award / revoke RPCs
-- ---------------------------------------------------------------------------

create or replace function public.grant_badge(
  p_profile_id uuid,
  p_badge_key text,
  p_reason text default null,
  p_source public.badge_award_source default 'manual',
  p_eligibility_source jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  definition public.badge_definitions;
  award_id uuid;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  select * into definition from public.badge_definitions where key = p_badge_key;
  if not found then
    raise exception 'Unknown badge' using errcode = 'P0002';
  end if;
  if not definition.is_active then
    raise exception 'This badge is not active' using errcode = '22023';
  end if;

  insert into public.badge_awards (
    profile_id, badge_key, source, eligibility_source, award_reason, awarded_by
  )
  values (p_profile_id, p_badge_key, p_source, p_eligibility_source, p_reason, auth.uid())
  on conflict (profile_id, badge_key) do update set
    revoked_at = null,
    revoked_by = null,
    revoke_reason = null,
    award_reason = coalesce(excluded.award_reason, public.badge_awards.award_reason),
    awarded_at = now()
  returning id into award_id;

  return award_id;
end;
$$;

revoke all on function public.grant_badge(uuid, text, text, public.badge_award_source, jsonb) from public;
grant execute on function public.grant_badge(uuid, text, text, public.badge_award_source, jsonb) to authenticated;

create or replace function public.revoke_badge(
  p_profile_id uuid,
  p_badge_key text,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  definition public.badge_definitions;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  if p_reason is null or length(trim(p_reason)) < 3 then
    raise exception 'A revoke reason is required' using errcode = '22023';
  end if;

  select * into definition from public.badge_definitions where key = p_badge_key;
  if not found then
    raise exception 'Unknown badge' using errcode = 'P0002';
  end if;

  if not definition.revocable then
    raise exception 'This badge cannot be revoked' using errcode = '42501';
  end if;

  update public.badge_awards
  set revoked_at = now(), revoked_by = auth.uid(), revoke_reason = p_reason
  where profile_id = p_profile_id and badge_key = p_badge_key and revoked_at is null;

  if not found then
    raise exception 'Award not found' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.revoke_badge(uuid, text, text) from public;
grant execute on function public.revoke_badge(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Automatic evaluation
-- ---------------------------------------------------------------------------
--
-- Runs the rule set for one profile. Called after signup (to convert waitlist
-- standing into early-access badges) and after order delivery.

-- Internal grant used by the rule engine; bypasses the admin check on purpose
-- but can only ever create 'automatic' awards for rule-backed badges.
create or replace function public.award_badge_internal(
  p_profile_id uuid,
  p_badge_key text,
  p_source jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.badge_awards (
    profile_id, badge_key, source, eligibility_source, award_reason
  )
  values (p_profile_id, p_badge_key, 'automatic', p_source, 'Rule satisfied')
  on conflict (profile_id, badge_key) do nothing;
end;
$$;

revoke all on function public.award_badge_internal(uuid, text, jsonb) from public;
revoke all on function public.award_badge_internal(uuid, text, jsonb) from authenticated;
revoke all on function public.award_badge_internal(uuid, text, jsonb) from anon;

create or replace function public.evaluate_profile_badges(p_profile_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  granted integer := 0;
  waitlist_entry public.waitlist_entries;
  delivered_count integer;
  collab_count integer;
  split_count integer;
begin
  if p_profile_id is null then
    return 0;
  end if;

  -- Early access: derived from the converted waitlist entry.
  select * into waitlist_entry
  from public.waitlist_entries
  where converted_profile_id = p_profile_id
    and verified_at is not null
  limit 1;

  if found then
    if waitlist_entry.queue_position <= 100 then
      perform public.award_badge_internal(
        p_profile_id, 'first_100',
        jsonb_build_object('queue_position', waitlist_entry.queue_position));
      granted := granted + 1;
    end if;

    if waitlist_entry.queue_position <= 1000 then
      perform public.award_badge_internal(
        p_profile_id, 'first_1000',
        jsonb_build_object('queue_position', waitlist_entry.queue_position));
      perform public.award_badge_internal(
        p_profile_id, 'founding_member',
        jsonb_build_object('queue_position', waitlist_entry.queue_position));
      granted := granted + 2;
    end if;

    if waitlist_entry.referral_count >= 3 then
      perform public.award_badge_internal(
        p_profile_id, 'early_supporter',
        jsonb_build_object('referrals', waitlist_entry.referral_count));
      granted := granted + 1;
    end if;
  end if;

  -- Marketplace: only paid+delivered orders count.
  select count(*) into delivered_count
  from public.order_requests
  where creator_id = p_profile_id
    and status = 'delivered'
    and payment_status = 'paid';

  if delivered_count >= 1 then
    perform public.award_badge_internal(
      p_profile_id, 'first_sale', jsonb_build_object('delivered', delivered_count));
    granted := granted + 1;
  end if;
  if delivered_count >= 10 then
    perform public.award_badge_internal(
      p_profile_id, 'ten_sales', jsonb_build_object('delivered', delivered_count));
    granted := granted + 1;
  end if;
  if delivered_count >= 100 then
    perform public.award_badge_internal(
      p_profile_id, 'hundred_sales', jsonb_build_object('delivered', delivered_count));
    granted := granted + 1;
  end if;

  -- Collaboration
  select count(*) into collab_count
  from public.collab_participants
  join public.collab_projects on collab_projects.id = collab_participants.project_id
  where collab_participants.user_id = p_profile_id
    and collab_participants.invite_status = 'accepted'
    and collab_projects.status = 'completed';

  if collab_count >= 1 then
    perform public.award_badge_internal(
      p_profile_id, 'first_collaboration', jsonb_build_object('projects', collab_count));
    granted := granted + 1;
  end if;
  if collab_count >= 5 then
    perform public.award_badge_internal(
      p_profile_id, 'reliable_collaborator', jsonb_build_object('projects', collab_count));
    granted := granted + 1;
  end if;

  select count(*) into split_count
  from public.revenue_splits
  where recipient_id = p_profile_id;

  if split_count >= 1 then
    perform public.award_badge_internal(
      p_profile_id, 'split_completed', jsonb_build_object('splits', split_count));
    granted := granted + 1;
  end if;

  return granted;
end;
$$;

revoke all on function public.evaluate_profile_badges(uuid) from public;
grant execute on function public.evaluate_profile_badges(uuid) to authenticated;

-- Re-evaluate badges when an order settles.
create or replace function public.evaluate_badges_on_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'delivered' and new.payment_status = 'paid' then
    perform public.evaluate_profile_badges(new.creator_id);
  end if;
  return new;
end;
$$;

drop trigger if exists evaluate_badges_on_order_trigger on public.order_requests;
create trigger evaluate_badges_on_order_trigger
  after update of status, payment_status on public.order_requests
  for each row execute function public.evaluate_badges_on_order();

-- ---------------------------------------------------------------------------
-- Public read helper
-- ---------------------------------------------------------------------------

create or replace function public.get_profile_badges(p_profile_id uuid)
returns table (
  badge_key text,
  name_tr text,
  name_en text,
  description_tr text,
  description_en text,
  category public.badge_category,
  rarity public.badge_rarity,
  icon text,
  tone text,
  awarded_at timestamptz,
  display_order integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    d.key, d.name_tr, d.name_en, d.description_tr, d.description_en,
    d.category, d.rarity, d.icon, d.tone, a.awarded_at,
    coalesce(a.display_order, d.display_order)
  from public.badge_awards a
  join public.badge_definitions d on d.key = a.badge_key
  where a.profile_id = p_profile_id
    and a.revoked_at is null
    and a.is_visible
    and (a.expires_at is null or a.expires_at > now())
    and d.is_active
  order by coalesce(a.display_order, d.display_order), a.awarded_at;
$$;

revoke all on function public.get_profile_badges(uuid) from public;
grant execute on function public.get_profile_badges(uuid) to anon, authenticated;

commit;
