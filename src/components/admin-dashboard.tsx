"use client";

import Link from "next/link";
import {
  AlertCircle,
  Ban,
  Gauge,
  KeyRound,
  Loader2,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Store,
  UserRound,
  UsersRound
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { UiSelect } from "@/components/ui-select";
import { useI18n } from "@/components/language-provider";
import { cn, currency, shortDate } from "@/lib/format";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured
} from "@/lib/supabase";

type AccountStatus = "active" | "suspended" | "banned";
type RetentionPlan = "standard" | "premium";
type AdminRole =
  | "super_admin"
  | "admin"
  | "moderator"
  | "support"
  | "finance"
  | "content_reviewer"
  | "analyst";
type AdminTab = "overview" | "users" | "listings" | "orders" | "skills";

type Overview = {
  total_users: number;
  active_users: number;
  suspended_users: number;
  banned_users: number;
  admin_users: number;
  artist_count: number;
  buyer_count: number;
  listing_count: number;
  active_listing_count: number;
  inactive_listing_count: number;
  order_count: number;
  open_order_count: number;
  reported_content_count: number;
};

type AdminUser = {
  id: string;
  role: "buyer" | "creator";
  handle: string;
  fullName: string;
  headline: string | null;
  location: string | null;
  status: AccountStatus;
  isAdmin: boolean;
  adminRole: AdminRole | null;
  isBetaHandleAllowed: boolean;
  isBetaDirectAllowed: boolean;
  isBetaAllowed: boolean;
  retentionPlan: RetentionPlan;
  retentionMultiplier: number;
  readiness: {
    score: number;
    level: "empty" | "started" | "ready" | "launch_ready";
    missing: string[];
  };
  createdAt: string;
};

type AdminListing = {
  id: string;
  title: string;
  category: string;
  genre: string;
  price: number;
  licenseType: string;
  isActive: boolean;
  exclusiveSold: boolean;
  creatorHandle: string;
  creatorName: string;
  createdAt: string;
};

type AdminOrder = {
  id: string;
  listingId: string;
  listingTitle: string;
  buyerName: string;
  creatorName: string;
  status: string;
  licenseTier: string;
  price: number;
  createdAt: string;
};

type AdminSkill = {
  id: string;
  slug: string;
  category_key: string;
  label: Record<string, string> | null;
  synonyms: string[];
  is_active: boolean;
  sort_order: number;
};

type AdminState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "unconfigured" }
  | {
      status: "ready";
      overview: Overview | null;
      users: AdminUser[];
      listings: AdminListing[];
      orders: AdminOrder[];
      skills: AdminSkill[];
    }
  | { status: "error"; message: string };

const tabs: Array<{ id: AdminTab; icon: typeof Gauge }> = [
  { id: "overview", icon: Gauge },
  { id: "users", icon: UsersRound },
  { id: "listings", icon: Store },
  { id: "orders", icon: ShieldCheck },
  { id: "skills", icon: SlidersHorizontal }
];

export function AdminDashboard() {
  const { currencyCode, language, usdTryRate } = useI18n();
  const [state, setState] = useState<AdminState>(() =>
    isSupabaseConfigured() ? { status: "loading" } : { status: "unconfigured" }
  );
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [query, setQuery] = useState("");
  const [userStatus, setUserStatus] = useState<"all" | AccountStatus>("all");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [updatingAdminId, setUpdatingAdminId] = useState<string | null>(null);
  const [updatingBetaId, setUpdatingBetaId] = useState<string | null>(null);
  const [updatingRetentionId, setUpdatingRetentionId] = useState<string | null>(null);

  const text = useMemo(() => getAdminCopy(language), [language]);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setState({ status: "unconfigured" });
      return;
    }

    const client = getSupabaseBrowserClient();
    if (!client) {
      setState({ status: "unconfigured" });
      return;
    }

    setState((current) => (current.status === "ready" ? current : { status: "loading" }));

    try {
      const {
        data: { session }
      } = await client.auth.getSession();

      if (!session) {
        setState({ status: "signed-out" });
        return;
      }

      const token = session.access_token;
      const userParams = new URLSearchParams();
      if (query.trim()) userParams.set("q", query.trim());
      if (userStatus !== "all") userParams.set("status", userStatus);

      const [overview, users, listings, orders, skills] = await Promise.all([
        adminFetch<{ overview: Overview | null }>("/api/admin/overview", token),
        adminFetch<{ users: AdminUser[] }>(`/api/admin/users?${userParams.toString()}`, token),
        adminFetch<{ listings: AdminListing[] }>("/api/admin/listings", token),
        adminFetch<{ orders: AdminOrder[] }>("/api/admin/orders", token),
        adminFetch<{ skills: AdminSkill[] }>("/api/admin/config/skills", token)
      ]);

      setState({
        status: "ready",
        overview: overview.overview,
        users: users.users,
        listings: listings.listings,
        orders: orders.orders,
        skills: skills.skills
      });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : text.error
      });
    }
  }, [query, text.error, userStatus]);

  useEffect(() => {
    void load();
  }, [load]);

  async function updateUserStatus(userId: string, status: AccountStatus) {
    const client = getSupabaseBrowserClient();
    if (!client || state.status !== "ready") return;

    setUpdatingUserId(userId);
    try {
      const {
        data: { session }
      } = await client.auth.getSession();
      if (!session) throw new Error(text.signInRequired);

      await adminFetch(`/api/admin/users/${userId}/status`, session.access_token, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });

      setState({
        ...state,
        users: state.users.map((user) =>
          user.id === userId ? { ...user, status } : user
        )
      });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : text.error
      });
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function updateAdminRole(user: AdminUser, isActive: boolean) {
    const client = getSupabaseBrowserClient();
    if (!client || state.status !== "ready") return;

    setUpdatingAdminId(user.id);
    try {
      const {
        data: { session }
      } = await client.auth.getSession();
      if (!session) throw new Error(text.signInRequired);

      await adminFetch(`/api/admin/users/${user.id}/admin-role`, session.access_token, {
        method: "PATCH",
        body: JSON.stringify({
          role: user.adminRole ?? "admin",
          isActive,
          reason: isActive ? "Granted beta/admin access from users panel." : "Disabled admin beta access from users panel."
        })
      });

      setState({
        ...state,
        users: state.users.map((current) =>
          current.id === user.id
            ? {
                ...current,
                isAdmin: isActive,
                adminRole: current.adminRole ?? "admin",
                isBetaAllowed: current.status === "active" && (isActive || current.isBetaHandleAllowed)
              }
            : current
        )
      });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : text.error
      });
    } finally {
      setUpdatingAdminId(null);
    }
  }

  async function updateBetaAccess(user: AdminUser, isActive: boolean) {
    const client = getSupabaseBrowserClient();
    if (!client || state.status !== "ready") return;

    setUpdatingBetaId(user.id);
    try {
      const {
        data: { session }
      } = await client.auth.getSession();
      if (!session) throw new Error(text.signInRequired);

      const response = await adminFetch<{ isActive: boolean }>(
        `/api/admin/users/${user.id}/beta-access`,
        session.access_token,
        {
          method: "PATCH",
          body: JSON.stringify({
            isActive,
            reason: isActive ? "Granted beta access from users panel." : "Revoked beta access from users panel."
          })
        }
      );

      setState({
        ...state,
        users: state.users.map((current) =>
          current.id === user.id
            ? {
                ...current,
                isBetaDirectAllowed: response.isActive,
                isBetaAllowed:
                  current.status === "active" &&
                  (current.isAdmin || response.isActive || current.isBetaHandleAllowed)
              }
            : current
        )
      });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : text.error
      });
    } finally {
      setUpdatingBetaId(null);
    }
  }

  async function updateRetentionPlan(user: AdminUser, plan: RetentionPlan) {
    const client = getSupabaseBrowserClient();
    if (!client || state.status !== "ready" || user.retentionPlan === plan) return;

    setUpdatingRetentionId(user.id);
    try {
      const {
        data: { session }
      } = await client.auth.getSession();
      if (!session) throw new Error(text.signInRequired);

      const response = await adminFetch<{ plan: RetentionPlan; retentionMultiplier: number }>(
        `/api/admin/users/${user.id}/retention-plan`,
        session.access_token,
        {
          method: "PATCH",
          body: JSON.stringify({
            plan,
            reason: `Set retention plan to ${plan} from users panel.`
          })
        }
      );

      setState({
        ...state,
        users: state.users.map((current) =>
          current.id === user.id
            ? {
                ...current,
                retentionPlan: response.plan,
                retentionMultiplier: response.retentionMultiplier
              }
            : current
        )
      });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : text.error
      });
    } finally {
      setUpdatingRetentionId(null);
    }
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-5 border-b border-white/10 pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 rounded-md border border-jam-blue/25 bg-jam-blue/10 px-3 py-2 text-xs font-semibold uppercase leading-5 text-jam-blue">
            <ShieldCheck size={15} />
            {text.eyebrow}
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
            {text.title}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="focus-ring inline-flex min-h-11 w-fit items-center gap-2 rounded-md border border-white/10 px-4 text-sm font-semibold text-white/68 transition hover:border-jam-blue/40 hover:bg-jam-blue/10 hover:text-white"
        >
          <RefreshCw size={16} />
          {text.refresh}
        </button>
      </div>

      {state.status === "loading" ? (
        <AdminNotice icon={<Loader2 className="animate-spin" />} title={text.loading} />
      ) : null}

      {state.status === "unconfigured" ? (
        <AdminNotice icon={<AlertCircle />} title={text.unconfigured} />
      ) : null}

      {state.status === "signed-out" ? (
        <AdminNotice
          icon={<UserRound />}
          title={text.signInRequired}
          action={{ href: "/auth/sign-in", label: text.signIn }}
        />
      ) : null}

      {state.status === "error" ? (
        <AdminNotice icon={<Ban />} title={text.error} description={state.message} />
      ) : null}

      {state.status === "ready" ? (
        <>
          <div className="mt-7 flex gap-2 overflow-x-auto pb-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "focus-ring inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md border px-4 text-sm font-semibold transition",
                    active
                      ? "border-jam-mint bg-jam-mint text-black"
                      : "border-white/10 bg-white/[0.035] text-white/66 hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
                  )}
                >
                  <Icon size={16} />
                  {text.tabs[tab.id]}
                </button>
              );
            })}
          </div>

          {activeTab === "overview" ? <OverviewPanel overview={state.overview} text={text} /> : null}
          {activeTab === "users" ? (
            <UsersPanel
              users={state.users}
              query={query}
              status={userStatus}
              updatingUserId={updatingUserId}
              updatingAdminId={updatingAdminId}
              updatingBetaId={updatingBetaId}
              updatingRetentionId={updatingRetentionId}
              text={text}
              onQueryChange={setQuery}
              onStatusChange={setUserStatus}
              onUpdateStatus={updateUserStatus}
              onUpdateAdminRole={updateAdminRole}
              onUpdateBetaAccess={updateBetaAccess}
              onUpdateRetentionPlan={updateRetentionPlan}
            />
          ) : null}
          {activeTab === "listings" ? (
            <ListingsPanel
              listings={state.listings}
              language={language}
              currencyCode={currencyCode}
              usdTryRate={usdTryRate}
              text={text}
            />
          ) : null}
          {activeTab === "orders" ? (
            <OrdersPanel
              orders={state.orders}
              language={language}
              currencyCode={currencyCode}
              usdTryRate={usdTryRate}
              text={text}
            />
          ) : null}
          {activeTab === "skills" ? <SkillsPanel skills={state.skills} language={language} text={text} /> : null}
        </>
      ) : null}
    </section>
  );
}

function OverviewPanel({ overview, text }: { overview: Overview | null; text: AdminCopy }) {
  const metrics = overview
    ? [
        [text.metrics.users, overview.total_users, `${overview.active_users} ${text.active}`],
        [text.metrics.artists, overview.artist_count, `${overview.buyer_count} ${text.buyers}`],
        [text.metrics.listings, overview.listing_count, `${overview.active_listing_count} ${text.active}`],
        [text.metrics.orders, overview.order_count, `${overview.open_order_count} ${text.open}`],
        [text.metrics.reports, overview.reported_content_count, text.pending],
        [text.metrics.admins, overview.admin_users, `${overview.suspended_users + overview.banned_users} ${text.restricted}`]
      ]
    : [];

  return (
    <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {metrics.map(([label, value, detail]) => (
        <div key={label} className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
          <p className="text-sm font-medium text-white/50">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
          <p className="mt-2 text-sm text-white/42">{detail}</p>
        </div>
      ))}
    </div>
  );
}

function UsersPanel({
  users,
  query,
  status,
  updatingUserId,
  updatingAdminId,
  updatingBetaId,
  updatingRetentionId,
  text,
  onQueryChange,
  onStatusChange,
  onUpdateStatus,
  onUpdateAdminRole,
  onUpdateBetaAccess,
  onUpdateRetentionPlan
}: {
  users: AdminUser[];
  query: string;
  status: "all" | AccountStatus;
  updatingUserId: string | null;
  updatingAdminId: string | null;
  updatingBetaId: string | null;
  updatingRetentionId: string | null;
  text: AdminCopy;
  onQueryChange: (query: string) => void;
  onStatusChange: (status: "all" | AccountStatus) => void;
  onUpdateStatus: (userId: string, status: AccountStatus) => Promise<void>;
  onUpdateAdminRole: (user: AdminUser, isActive: boolean) => Promise<void>;
  onUpdateBetaAccess: (user: AdminUser, isActive: boolean) => Promise<void>;
  onUpdateRetentionPlan: (user: AdminUser, plan: RetentionPlan) => Promise<void>;
}) {
  return (
    <div className="mt-7">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={text.searchUsers}
          className="input-field"
        />
        <UiSelect
          value={status}
          onChange={onStatusChange}
          ariaLabel={text.status}
          options={[
            { value: "all", label: text.all },
            { value: "active", label: text.active },
            { value: "suspended", label: text.suspended },
            { value: "banned", label: text.banned }
          ]}
        />
      </div>

      <TableShell>
        <thead>
          <tr>
            {[
              text.user,
              text.role,
              accessLabel(text),
              text.readiness,
              text.retention,
              text.status,
              text.joined,
              text.actions
            ].map((label) => (
              <Th key={label}>{label}</Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-t border-white/8">
              <Td>
                <div className="min-w-0">
                  <p className="font-semibold text-white">
                    {user.fullName}
                  </p>
                  <p className="mt-1 text-xs text-white/42">@{user.handle}</p>
                </div>
              </Td>
              <Td>{user.role}</Td>
              <Td>
                <div className="flex flex-wrap gap-1.5">
                  {user.isBetaAllowed ? (
                    <span className="inline-flex items-center gap-1 rounded-md border border-jam-mint/30 bg-jam-mint/10 px-2 py-1 text-xs font-semibold text-jam-mint">
                      <ShieldCheck size={12} />
                      {accessStateLabel(text, true)}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-xs font-semibold text-white/42">
                      <Ban size={12} />
                      {accessStateLabel(text, false)}
                    </span>
                  )}
                  {user.isAdmin ? (
                    <span className="inline-flex items-center gap-1 rounded-md border border-jam-blue/30 bg-jam-blue/10 px-2 py-1 text-xs font-semibold text-jam-blue">
                      <KeyRound size={12} />
                      {user.adminRole ?? "admin"}
                    </span>
                  ) : null}
                  {user.isBetaDirectAllowed ? (
                    <span className="inline-flex items-center gap-1 rounded-md border border-jam-gold/30 bg-jam-gold/10 px-2 py-1 text-xs font-semibold text-jam-gold">
                      <ShieldCheck size={12} />
                      {text.directBeta}
                    </span>
                  ) : null}
                </div>
              </Td>
              <Td>
                <ReadinessBadge user={user} text={text} />
              </Td>
              <Td>
                <div className="flex flex-col gap-1.5">
                  <span className="inline-flex w-fit rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-xs font-semibold text-white/66">
                    {retentionPlanLabel(text, user.retentionPlan)}
                    <span className="ml-1 text-white/34">x{user.retentionMultiplier}</span>
                  </span>
                  <span className="text-[11px] text-white/36">
                    {user.retentionPlan === "premium" ? text.retentionPremiumHint : text.retentionStandardHint}
                  </span>
                </div>
              </Td>
              <Td><StatusPill status={user.status} text={text} /></Td>
              <Td>{shortDate(user.createdAt)}</Td>
              <Td>
                <div className="flex flex-wrap gap-2">
                  {(["active", "suspended", "banned"] as const).map((nextStatus) => (
                    <button
                      key={nextStatus}
                      type="button"
                      disabled={updatingUserId === user.id || user.status === nextStatus}
                      onClick={() => void onUpdateStatus(user.id, nextStatus)}
                      className="focus-ring rounded-md border border-white/10 px-2.5 py-1.5 text-xs font-semibold text-white/62 transition hover:border-jam-blue/35 hover:bg-jam-blue/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      {text.statusLabels[nextStatus]}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={updatingAdminId === user.id}
                    onClick={() => void onUpdateAdminRole(user, !user.isAdmin)}
                    className="focus-ring rounded-md border border-white/10 px-2.5 py-1.5 text-xs font-semibold text-white/62 transition hover:border-jam-mint/35 hover:bg-jam-mint/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    {adminActionLabel(text, user.isAdmin, updatingAdminId === user.id)}
                  </button>
                  <button
                    type="button"
                    disabled={updatingBetaId === user.id || user.isBetaHandleAllowed || user.isAdmin}
                    onClick={() => void onUpdateBetaAccess(user, !user.isBetaDirectAllowed)}
                    className="focus-ring rounded-md border border-white/10 px-2.5 py-1.5 text-xs font-semibold text-white/62 transition hover:border-jam-gold/35 hover:bg-jam-gold/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    {betaActionLabel(text, user, updatingBetaId === user.id)}
                  </button>
                  {(["standard", "premium"] as const).map((plan) => (
                    <button
                      key={plan}
                      type="button"
                      disabled={updatingRetentionId === user.id || user.retentionPlan === plan}
                      onClick={() => void onUpdateRetentionPlan(user, plan)}
                      className="focus-ring rounded-md border border-white/10 px-2.5 py-1.5 text-xs font-semibold text-white/62 transition hover:border-jam-blue/35 hover:bg-jam-blue/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      {retentionActionLabel(text, plan, updatingRetentionId === user.id)}
                    </button>
                  ))}
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </TableShell>
    </div>
  );
}

function ListingsPanel({
  listings,
  language,
  currencyCode,
  usdTryRate,
  text
}: {
  listings: AdminListing[];
  language: "tr" | "en";
  currencyCode: "USD" | "TRY";
  usdTryRate: number;
  text: AdminCopy;
}) {
  return (
    <TableShell>
      <thead>
        <tr>
          {[text.listing, text.creator, text.category, text.price, text.status].map((label) => (
            <Th key={label}>{label}</Th>
          ))}
        </tr>
      </thead>
      <tbody>
        {listings.map((listing) => (
          <tr key={listing.id} className="border-t border-white/8">
            <Td>
              <Link href={`/listing/${listing.id}`} className="font-semibold text-white hover:text-jam-mint">
                {listing.title}
              </Link>
              <p className="mt-1 text-xs text-white/42">{listing.genre}</p>
            </Td>
            <Td>@{listing.creatorHandle}</Td>
            <Td>{listing.category}</Td>
            <Td>{currency(listing.price, language, currencyCode, usdTryRate)}</Td>
            <Td>{listing.isActive ? text.active : listing.exclusiveSold ? text.exclusiveSold : text.inactive}</Td>
          </tr>
        ))}
      </tbody>
    </TableShell>
  );
}

function OrdersPanel({
  orders,
  language,
  currencyCode,
  usdTryRate,
  text
}: {
  orders: AdminOrder[];
  language: "tr" | "en";
  currencyCode: "USD" | "TRY";
  usdTryRate: number;
  text: AdminCopy;
}) {
  return (
    <TableShell>
      <thead>
        <tr>
          {[text.order, text.buyer, text.creator, text.price, text.status].map((label) => (
            <Th key={label}>{label}</Th>
          ))}
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => (
          <tr key={order.id} className="border-t border-white/8">
            <Td>
              <Link href={`/orders/${order.id}`} className="font-semibold text-white hover:text-jam-mint">
                {order.listingTitle}
              </Link>
              <p className="mt-1 text-xs text-white/42">{shortDate(order.createdAt, language)}</p>
            </Td>
            <Td>{order.buyerName}</Td>
            <Td>{order.creatorName}</Td>
            <Td>{currency(order.price, language, currencyCode, usdTryRate)}</Td>
            <Td>{order.status}</Td>
          </tr>
        ))}
      </tbody>
    </TableShell>
  );
}

function SkillsPanel({
  skills,
  language,
  text
}: {
  skills: AdminSkill[];
  language: "tr" | "en";
  text: AdminCopy;
}) {
  return (
    <TableShell>
      <thead>
        <tr>
          {[text.skill, text.category, text.status, text.synonyms].map((label) => (
            <Th key={label}>{label}</Th>
          ))}
        </tr>
      </thead>
      <tbody>
        {skills.map((skill) => (
          <tr key={skill.id} className="border-t border-white/8">
            <Td>
              <p className="font-semibold text-white">{skill.label?.[language] ?? skill.slug}</p>
              <p className="mt-1 text-xs text-white/42">{skill.slug}</p>
            </Td>
            <Td>{skill.category_key}</Td>
            <Td>{skill.is_active ? text.active : text.inactive}</Td>
            <Td>{skill.synonyms.slice(0, 5).join(", ")}</Td>
          </tr>
        ))}
      </tbody>
    </TableShell>
  );
}

function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-7 overflow-x-auto rounded-lg border border-white/10 bg-white/[0.04]">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
        {children}
      </table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-xs font-semibold uppercase text-white/42">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-4 align-middle text-white/66">{children}</td>;
}

function StatusPill({ status, text }: { status: AccountStatus; text: AdminCopy }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
        status === "active" && "border-emerald-300/20 bg-emerald-300/10 text-emerald-200",
        status === "suspended" && "border-amber-300/20 bg-amber-300/10 text-amber-200",
        status === "banned" && "border-rose-300/20 bg-rose-300/10 text-rose-200"
      )}
    >
      {text.statusLabels[status]}
    </span>
  );
}

function ReadinessBadge({ user, text }: { user: AdminUser; text: AdminCopy }) {
  const ready = user.readiness.level === "launch_ready" || user.readiness.level === "ready";
  const label = readinessLevelLabel(text, user.readiness.level);
  const missing = user.readiness.missing[0];

  return (
    <div className="min-w-[8rem]">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className={ready ? "font-bold text-jam-mint" : "font-bold text-white/58"}>
          {label}
        </span>
        <span className="font-bold tabular-nums text-white/60">{user.readiness.score}%</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/8">
        <div
          className={ready ? "h-full rounded-full bg-jam-mint" : "h-full rounded-full bg-jam-blue"}
          style={{ width: `${user.readiness.score}%` }}
        />
      </div>
      {missing ? <p className="mt-1 text-[11px] text-white/34">{missing}</p> : null}
    </div>
  );
}

function accessLabel(text: AdminCopy) {
  return text.signIn === "Sign in" ? "Access" : "Erisim";
}

function accessStateLabel(text: AdminCopy, allowed: boolean) {
  if (text.signIn === "Sign in") return allowed ? "Beta" : "Closed";
  return allowed ? "Beta" : "Kapali";
}

function retentionPlanLabel(text: AdminCopy, plan: RetentionPlan) {
  if (text.signIn === "Sign in") return plan === "premium" ? "Premium" : "Standard";
  return plan === "premium" ? "Premium" : "Standart";
}

function retentionActionLabel(text: AdminCopy, plan: RetentionPlan, loading: boolean) {
  if (text.signIn === "Sign in") {
    if (loading) return "Updating";
    return plan === "premium" ? "Set premium" : "Set standard";
  }
  if (loading) return "Isleniyor";
  return plan === "premium" ? "Premium yap" : "Standart yap";
}

function readinessLevelLabel(text: AdminCopy, level: AdminUser["readiness"]["level"]) {
  const en = text.signIn === "Sign in";
  if (en) {
    return {
      empty: "Empty",
      started: "Started",
      ready: "Ready",
      launch_ready: "Launch"
    }[level];
  }
  return {
    empty: "Bos",
    started: "Basladi",
    ready: "Hazir",
    launch_ready: "Launch"
  }[level];
}

function adminActionLabel(text: AdminCopy, isAdmin: boolean, loading: boolean) {
  if (text.signIn === "Sign in") {
    if (loading) return "Updating";
    return isAdmin ? "Disable admin" : "Grant admin";
  }
  if (loading) return "Isleniyor";
  return isAdmin ? "Admin kapat" : "Admin yap";
}

function betaActionLabel(text: AdminCopy, user: AdminUser, loading: boolean) {
  if (text.signIn === "Sign in") {
    if (loading) return "Updating";
    if (user.isAdmin) return "Admin beta";
    if (user.isBetaHandleAllowed) return "Handle beta";
    return user.isBetaDirectAllowed ? "Close beta" : "Open beta";
  }
  if (loading) return "Isleniyor";
  if (user.isAdmin) return "Admin beta";
  if (user.isBetaHandleAllowed) return "Handle beta";
  return user.isBetaDirectAllowed ? "Betayi kapat" : "Betayi ac";
}

function AdminNotice({
  icon,
  title,
  description,
  action
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mt-8 flex min-h-72 flex-col items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] p-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-jam-blue/15 text-jam-blue">
        {icon}
      </span>
      <h2 className="mt-4 text-xl font-semibold text-white">{title}</h2>
      {description ? <p className="mt-2 max-w-xl text-sm leading-6 text-white/54">{description}</p> : null}
      {action ? (
        <Link href={action.href} className="focus-ring mt-5 rounded-full bg-white px-5 py-3 text-sm font-bold text-black hover:bg-jam-mint">
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

async function adminFetch<T>(
  path: string,
  token: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init.headers
    }
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof payload.message === "string"
        ? payload.message
        : "Admin request failed."
    );
  }

  return payload as T;
}

type AdminCopy = ReturnType<typeof getAdminCopy>;

function getAdminCopy(language: "tr" | "en") {
  if (language === "tr") {
    return {
      eyebrow: "Admin",
      title: "Platform kontrol merkezi",
      refresh: "Yenile",
      loading: "Admin verileri yükleniyor...",
      unconfigured: "Canlı Supabase bağlantısı olmadan admin paneli kullanılamaz.",
      signInRequired: "Admin paneli için giriş yapmalısınız.",
      signIn: "Giriş yap",
      error: "Admin paneli yüklenemedi",
      all: "Tümü",
      active: "Aktif",
      inactive: "Pasif",
      suspended: "Askıda",
      banned: "Yasaklı",
      open: "açık",
      pending: "beklemede",
      restricted: "kısıtlı hesap",
      buyers: "alıcı",
      exclusiveSold: "Exclusive satıldı",
      searchUsers: "Kullanıcı ara",
      user: "Kullanıcı",
      role: "Rol",
      status: "Durum",
      joined: "Katılım",
      actions: "Aksiyon",
      directBeta: "Panel beta",
      readiness: "Hazirlik",
      retention: "Veri plani",
      retentionStandardHint: "30 gun",
      retentionPremiumHint: "60 gun",
      listing: "İlan",
      creator: "Üretici",
      buyer: "Alıcı",
      category: "Kategori",
      price: "Fiyat",
      order: "Sipariş",
      skill: "Skill",
      synonyms: "Sinyaller",
      tabs: {
        overview: "Özet",
        users: "Kullanıcılar",
        listings: "İlanlar",
        orders: "Siparişler",
        skills: "Skill config"
      },
      metrics: {
        users: "Toplam kullanıcı",
        artists: "Artist / buyer",
        listings: "İlanlar",
        orders: "Siparişler",
        reports: "Raporlar",
        admins: "Adminler"
      },
      statusLabels: {
        active: "Aktif",
        suspended: "Askıya al",
        banned: "Yasakla"
      }
    };
  }

  return {
    eyebrow: "Admin",
    title: "Platform control center",
    refresh: "Refresh",
    loading: "Loading admin data...",
    unconfigured: "Admin requires a live Supabase connection.",
    signInRequired: "Sign in is required for admin.",
    signIn: "Sign in",
    error: "Admin could not be loaded",
    all: "All",
    active: "Active",
    inactive: "Inactive",
    suspended: "Suspended",
    banned: "Banned",
    open: "open",
    pending: "pending",
    restricted: "restricted accounts",
    buyers: "buyers",
    exclusiveSold: "Exclusive sold",
    searchUsers: "Search users",
    user: "User",
    role: "Role",
    status: "Status",
    joined: "Joined",
    actions: "Actions",
    directBeta: "Direct beta",
    readiness: "Readiness",
    retention: "Data plan",
    retentionStandardHint: "30 days",
    retentionPremiumHint: "60 days",
    listing: "Listing",
    creator: "Creator",
    buyer: "Buyer",
    category: "Category",
    price: "Price",
    order: "Order",
    skill: "Skill",
    synonyms: "Signals",
    tabs: {
      overview: "Overview",
      users: "Users",
      listings: "Listings",
      orders: "Orders",
      skills: "Skill config"
    },
    metrics: {
      users: "Total users",
      artists: "Artists / buyers",
      listings: "Listings",
      orders: "Orders",
      reports: "Reports",
      admins: "Admins"
    },
    statusLabels: {
      active: "Activate",
      suspended: "Suspend",
      banned: "Ban"
    }
  };
}
