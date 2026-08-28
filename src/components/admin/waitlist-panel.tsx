"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Loader2,
  MailCheck,
  RotateCcw,
  Search,
  ShieldX,
  Sparkles,
  UsersRound
} from "lucide-react";
import { useI18n } from "@/components/language-provider";
import { AdminCell, AdminRow, AdminTable, Pagination, StatusPill } from "@/components/admin/admin-table";
import { TextInput } from "@/components/ui/field";
import { Card, Pill } from "@/components/ui/surface";
import { adminFetch, AdminRequestError } from "@/lib/admin-client";
import { shortDate } from "@/lib/format";
import {
  allowedWaitlistTransitions,
  canTransitionWaitlistStatus,
  waitlistIntentBucket,
  waitlistIntentScore,
  type WaitlistStatus
} from "@/lib/waitlist-admin";

type WaitlistEntry = {
  id: string;
  email: string;
  display_name: string | null;
  reserved_username: string | null;
  persona: string;
  locale: string;
  status: WaitlistStatus;
  queue_position: number;
  referral_code: string;
  referral_count: number;
  risk_flags: string[];
  utm_source: string | null;
  utm_campaign: string | null;
  verified_at: string | null;
  invited_at: string | null;
  converted_at: string | null;
  created_at: string;
};

type Response = {
  entries: WaitlistEntry[];
  total: number;
  page: number;
  pageSize: number;
  summary: WaitlistSummary;
};

const statusFilters = ["", "pending", "verified", "invited", "converted", "blocked"] as const;

type WaitlistSummary = {
  total: number;
  statuses: {
    pending: number;
    verified: number;
    invited: number;
    converted: number;
    blocked: number;
  };
  personas: {
    creator: number;
    buyer: number;
    both: number;
  };
  flagged: number;
  joinedLast24h: number;
  withReferrals: number;
  triage: {
    inviteReady: number;
    growthLeads: number;
    needsReview: number;
    conversionBacklog: number;
  };
};

export function WaitlistPanel() {
  const { language } = useI18n();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [status, setStatus] = useState<string>("");
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [data, setData] = useState<Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingEntryId, setUpdatingEntryId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query);
      setPage(0);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [query]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (debouncedQuery) params.set("q", debouncedQuery);
      if (status) params.set("status", status);
      if (flaggedOnly) params.set("flagged", "true");

      setData(await adminFetch<Response>(`/api/admin/waitlist?${params}`));
    } catch (requestError) {
      setError(
        requestError instanceof AdminRequestError
          ? requestError.message
          : language === "tr"
            ? "Liste yuklenemedi."
            : "The list could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, status, flaggedOnly, page, language]);

  useEffect(() => {
    void load();
  }, [load]);

  const tr = language === "tr";

  async function updateStatus(entry: WaitlistEntry, nextStatus: WaitlistStatus) {
    if (!canTransitionWaitlistStatus(entry.status, nextStatus)) return;

    setUpdatingEntryId(entry.id);
    setError(null);
    try {
      await adminFetch<{ ok: true; status: WaitlistStatus }>(
        `/api/admin/waitlist/${entry.id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status: nextStatus,
            reason: `Admin changed pre-register status from ${entry.status} to ${nextStatus}.`
          })
        }
      );
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof AdminRequestError
          ? requestError.message
          : tr
            ? "Durum guncellenemedi."
            : "Status could not be updated."
      );
    } finally {
      setUpdatingEntryId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {data?.summary ? <WaitlistSummaryBand summary={data.summary} language={language} /> : null}

      <Card className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-[16rem] flex-1 flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-white/72">
            {tr ? "Ara" : "Search"}
          </span>
          <span className="relative">
            <Search
              size={15}
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/36"
            />
            <TextInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={tr ? "E-posta, ad veya kullanici adi" : "Email, name or username"}
              className="pl-9"
            />
          </span>
        </label>

        <div className="flex flex-wrap gap-1.5">
          {statusFilters.map((value) => (
            <button
              key={value || "all"}
              type="button"
              aria-pressed={status === value}
              onClick={() => {
                setStatus(value);
                setPage(0);
              }}
              className={
                status === value
                  ? "focus-ring min-h-control-sm rounded-md border border-jam-blue/44 bg-jam-blue/14 px-3 text-[13px] font-semibold text-jam-mint"
                  : "focus-ring min-h-control-sm rounded-md border border-white/10 px-3 text-[13px] font-semibold text-white/58 transition hover:text-white"
              }
            >
              {value ? statusLabel(value, language) : tr ? "Tumu" : "All"}
            </button>
          ))}
          <button
            type="button"
            aria-pressed={flaggedOnly}
            onClick={() => {
              setFlaggedOnly((current) => !current);
              setPage(0);
            }}
            className={
              flaggedOnly
                ? "focus-ring inline-flex min-h-control-sm items-center gap-1.5 rounded-md border border-jam-warning/44 bg-jam-warning/12 px-3 text-[13px] font-semibold text-jam-warning"
                : "focus-ring inline-flex min-h-control-sm items-center gap-1.5 rounded-md border border-white/10 px-3 text-[13px] font-semibold text-white/58 transition hover:text-white"
            }
          >
            <AlertTriangle size={13} />
            {tr ? "Riskli" : "Flagged"}
          </button>
        </div>
      </Card>

      <AdminTable
        columns={[
          "#",
          tr ? "E-posta" : "Email",
          tr ? "Ad" : "Name",
          tr ? "Kullanici adi" : "Username",
          tr ? "Tip" : "Persona",
          tr ? "Sinyal" : "Signal",
          tr ? "Durum" : "Status",
          tr ? "Davet" : "Referrals",
          tr ? "Kaynak" : "Source",
          tr ? "Kayit" : "Joined",
          tr ? "Aksiyon" : "Action"
        ]}
        loading={loading}
        error={error}
        empty={!loading && (data?.entries.length ?? 0) === 0}
      >
        {data?.entries.map((entry) => (
          <AdminRow key={entry.id}>
            <AdminCell nowrap className="font-bold tabular-nums text-jam-mint">
              {entry.queue_position}
            </AdminCell>
            <AdminCell>
              <span className="flex items-center gap-2">
                {entry.email}
                {entry.risk_flags.length > 0 ? (
                  <Pill tone="warning" className="text-[10px]">
                    {entry.risk_flags[0]}
                  </Pill>
                ) : null}
              </span>
            </AdminCell>
            <AdminCell>{entry.display_name ?? "-"}</AdminCell>
            <AdminCell nowrap>
              {entry.reserved_username ? `@${entry.reserved_username}` : "-"}
            </AdminCell>
            <AdminCell nowrap>{entry.persona}</AdminCell>
            <AdminCell nowrap>
              <IntentPill entry={entry} language={language} />
            </AdminCell>
            <AdminCell nowrap>
              <StatusPill value={entry.status} label={statusLabel(entry.status, language)} />
            </AdminCell>
            <AdminCell nowrap className="tabular-nums">
              {entry.referral_count}
            </AdminCell>
            <AdminCell nowrap>{entry.utm_source ?? "-"}</AdminCell>
            <AdminCell nowrap>{shortDate(entry.created_at, language)}</AdminCell>
            <AdminCell>
              <WaitlistActions
                entry={entry}
                loading={updatingEntryId === entry.id}
                language={language}
                onUpdateStatus={updateStatus}
              />
            </AdminCell>
          </AdminRow>
        ))}
      </AdminTable>

      {data ? (
        <Pagination
          page={data.page}
          total={data.total}
          pageSize={data.pageSize}
          onPageChange={setPage}
        />
      ) : null}
    </div>
  );
}

function WaitlistSummaryBand({
  summary,
  language
}: {
  summary: WaitlistSummary;
  language: "tr" | "en";
}) {
  const tr = language === "tr";
  const metrics = [
    {
      label: tr ? "Davete hazir" : "Invite-ready",
      value: summary.triage.inviteReady,
      detail: tr
        ? "Dogrulanmis, beta dalgasina alinabilir"
        : "Verified entries ready for a beta wave",
      icon: MailCheck,
      tone: "success"
    },
    {
      label: tr ? "Buyume sinyali" : "Growth signal",
      value: summary.triage.growthLeads,
      detail: tr ? "Referral getiren on kayit" : "Pre-registers bringing referrals",
      icon: Sparkles,
      tone: "brand"
    },
    {
      label: tr ? "Inceleme" : "Review",
      value: summary.triage.needsReview,
      detail: tr ? "Riskli veya bloklu kayit" : "Flagged or blocked entries",
      icon: AlertTriangle,
      tone: summary.triage.needsReview > 0 ? "warning" : "neutral"
    },
    {
      label: tr ? "Davet takip" : "Invite follow-up",
      value: summary.triage.conversionBacklog,
      detail: tr ? "Davet edildi, henuz hesaba donmedi" : "Invited but not converted yet",
      icon: Clock3
    },
    {
      label: tr ? "Toplam on kayit" : "Total pre-registers",
      value: summary.total,
      detail: tr
        ? String(summary.statuses.pending) + " beklemede"
        : String(summary.statuses.pending) + " pending",
      icon: UsersRound
    },
    {
      label: tr ? "Son 24 saat" : "Last 24 hours",
      value: summary.joinedLast24h,
      detail: tr ? "Yeni talep" : "New joins",
      icon: Clock3
    },
    {
      label: tr ? "Uretici ilgisi" : "Creator intent",
      value: summary.personas.creator + summary.personas.both,
      detail: tr
        ? String(summary.personas.buyer + summary.personas.both) + " alici ilgisi"
        : String(summary.personas.buyer + summary.personas.both) + " buyer intent",
      icon: Sparkles
    },
    {
      label: tr ? "Davet edilen" : "Invited",
      value: summary.statuses.invited,
      detail: tr
        ? String(summary.statuses.converted) + " hesaba donustu"
        : String(summary.statuses.converted) + " converted",
      icon: MailCheck
    },
    {
      label: tr ? "Referral tasiyan" : "With referrals",
      value: summary.withReferrals,
      detail: tr ? "Agi buyuten kayit" : "Growth-bearing entries",
      icon: CheckCircle2
    },
    {
      label: tr ? "Riskli kayit" : "Flagged",
      value: summary.flagged,
      detail: tr
        ? String(summary.statuses.blocked) + " bloklandi"
        : String(summary.statuses.blocked) + " blocked",
      icon: AlertTriangle,
      tone: summary.flagged > 0 ? "warning" : "neutral"
    }
  ];

  return (
    <Card>
      <div className="flex flex-col gap-2 border-b border-white/8 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-jam-blue">
            {tr ? "On kayit hatti" : "Pre-register pipeline"}
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white">
            {tr ? "Talep, niyet ve risk ozeti" : "Demand, intent, and risk snapshot"}
          </h2>
        </div>
        <Pill tone="brand">
          {summary.statuses.verified} {tr ? "dogrulanmis" : "verified"}
        </Pill>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className={
                metric.tone === "warning"
                  ? "border-l-2 border-jam-warning bg-jam-warning/[0.045] px-4 py-3"
                  : metric.tone === "success"
                    ? "border-l-2 border-jam-success bg-jam-success/[0.045] px-4 py-3"
                    : metric.tone === "brand"
                      ? "border-l-2 border-jam-blue bg-jam-blue/[0.045] px-4 py-3"
                      : "border-l border-white/10 bg-white/[0.025] px-4 py-3"
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/38">
                    {metric.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold tabular-nums text-white">
                    {metric.value}
                  </p>
                </div>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-white/8 bg-white/[0.04] text-jam-mint">
                  <Icon size={17} />
                </span>
              </div>
              <p className="mt-2 text-[13px] text-white/48">{metric.detail}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function IntentPill({
  entry,
  language
}: {
  entry: WaitlistEntry;
  language: "tr" | "en";
}) {
  const score = waitlistIntentScore(entry);
  const bucket = waitlistIntentBucket(score);
  const tr = language === "tr";
  const label =
    bucket === "high"
      ? tr
        ? "Sicak"
        : "Hot"
      : bucket === "warm"
        ? tr
          ? "Hazir"
          : "Warm"
        : bucket === "watch"
          ? tr
            ? "Izle"
            : "Watch"
          : tr
            ? "Dusuk"
            : "Low";
  const tone =
    bucket === "high"
      ? "success"
      : bucket === "warm"
        ? "brand"
        : bucket === "watch"
          ? "warning"
          : "neutral";

  return (
    <Pill tone={tone} className="text-[10px]">
      {label} {score}
    </Pill>
  );
}

function WaitlistActions({
  entry,
  loading,
  language,
  onUpdateStatus
}: {
  entry: WaitlistEntry;
  loading: boolean;
  language: "tr" | "en";
  onUpdateStatus: (entry: WaitlistEntry, status: WaitlistStatus) => Promise<void>;
}) {
  const transitions = allowedWaitlistTransitions(entry.status);

  if (entry.status === "converted") {
    return (
      <Pill tone="success" className="text-[10px]">
        {language === "tr" ? "Hesaba donustu" : "Converted"}
      </Pill>
    );
  }

  if (transitions.length === 0) {
    return <span className="text-xs text-white/38">-</span>;
  }

  return (
    <div className="flex min-w-[13rem] flex-wrap gap-1.5">
      {transitions.map((nextStatus) => {
        const Icon = actionIcon(nextStatus);
        return (
          <button
            key={nextStatus}
            type="button"
            disabled={loading}
            onClick={() => void onUpdateStatus(entry, nextStatus)}
            className="focus-ring inline-flex min-h-8 items-center gap-1.5 rounded-md border border-white/10 px-2.5 text-xs font-semibold text-white/62 transition hover:border-jam-blue/35 hover:bg-jam-blue/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            title={actionLabel(nextStatus, language)}
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Icon size={13} />}
            {actionLabel(nextStatus, language)}
          </button>
        );
      })}
    </div>
  );
}

function actionIcon(status: WaitlistStatus) {
  switch (status) {
    case "invited":
      return MailCheck;
    case "blocked":
    case "suppressed":
      return ShieldX;
    case "verified":
      return RotateCcw;
    default:
      return CheckCircle2;
  }
}

function actionLabel(status: WaitlistStatus, language: "tr" | "en") {
  const tr = language === "tr";
  switch (status) {
    case "verified":
      return tr ? "Aktiflestir" : "Reopen";
    case "invited":
      return tr ? "Davet et" : "Invite";
    case "suppressed":
      return tr ? "Bastir" : "Suppress";
    case "blocked":
      return tr ? "Blokla" : "Block";
    default:
      return statusLabel(status, language);
  }
}

function statusLabel(status: WaitlistStatus | "", language: "tr" | "en") {
  if (language === "en") {
    return status || "All";
  }
  switch (status) {
    case "pending":
      return "Beklemede";
    case "verified":
      return "Dogrulandi";
    case "invited":
      return "Davet edildi";
    case "converted":
      return "Donustu";
    case "suppressed":
      return "Bastirildi";
    case "blocked":
      return "Bloklandi";
    default:
      return "Tumu";
  }
}
