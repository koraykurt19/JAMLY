"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Search } from "lucide-react";
import { useI18n } from "@/components/language-provider";
import { AdminCell, AdminRow, AdminTable, Pagination, StatusPill } from "@/components/admin/admin-table";
import { TextInput } from "@/components/ui/field";
import { Card, Pill } from "@/components/ui/surface";
import { adminFetch, AdminRequestError } from "@/lib/admin-client";
import { shortDate } from "@/lib/format";

type WaitlistEntry = {
  id: string;
  email: string;
  display_name: string | null;
  reserved_username: string | null;
  persona: string;
  locale: string;
  status: string;
  queue_position: number;
  referral_code: string;
  referral_count: number;
  risk_flags: string[];
  utm_source: string | null;
  utm_campaign: string | null;
  verified_at: string | null;
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

  // Debounce so typing does not fire a request per keystroke.
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
            ? "Liste yüklenemedi."
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
              placeholder={tr ? "E-posta, ad veya kullanıcı adı" : "Email, name or username"}
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
              {value ? value : tr ? "Tümü" : "All"}
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
          tr ? "Kullanıcı adı" : "Username",
          tr ? "Tip" : "Persona",
          tr ? "Durum" : "Status",
          tr ? "Davet" : "Referrals",
          tr ? "Kaynak" : "Source",
          tr ? "Kayıt" : "Joined"
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
            <AdminCell>{entry.display_name ?? "—"}</AdminCell>
            <AdminCell nowrap>
              {entry.reserved_username ? `@${entry.reserved_username}` : "—"}
            </AdminCell>
            <AdminCell nowrap>{entry.persona}</AdminCell>
            <AdminCell nowrap>
              <StatusPill value={entry.status} />
            </AdminCell>
            <AdminCell nowrap className="tabular-nums">
              {entry.referral_count}
            </AdminCell>
            <AdminCell nowrap>{entry.utm_source ?? "—"}</AdminCell>
            <AdminCell nowrap>{shortDate(entry.created_at, language)}</AdminCell>
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
