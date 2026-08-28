"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  MailCheck,
  RotateCcw,
  Search,
  ShieldX
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
};

const statusFilters = ["", "pending", "verified", "invited", "converted", "blocked"] as const;

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
