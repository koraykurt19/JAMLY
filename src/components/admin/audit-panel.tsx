"use client";

import { useCallback, useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useI18n } from "@/components/language-provider";
import { AdminCell, AdminRow, AdminTable, Pagination } from "@/components/admin/admin-table";
import { TextInput } from "@/components/ui/field";
import { Card, Pill } from "@/components/ui/surface";
import { adminFetch, AdminRequestError, adminRoleLabels, type AdminRole } from "@/lib/admin-client";
import { shortDate } from "@/lib/format";

type AuditEntry = {
  id: number;
  actor_id: string | null;
  actor_role: AdminRole | null;
  action: string;
  target_type: string;
  target_id: string | null;
  before_summary: Record<string, unknown> | null;
  after_summary: Record<string, unknown> | null;
  reason: string | null;
  result: string;
  created_at: string;
};

type Response = { entries: AuditEntry[]; total: number; page: number; pageSize: number };

export function AuditPanel() {
  const { language } = useI18n();
  const [action, setAction] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(0);
  const [data, setData] = useState<Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(action);
      setPage(0);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [action]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (debounced) params.set("action", debounced);
      setData(await adminFetch<Response>(`/api/admin/audit?${params}`));
    } catch (requestError) {
      setError(
        requestError instanceof AdminRequestError
          ? requestError.message
          : language === "tr"
            ? "Denetim kaydı yüklenemedi."
            : "The audit log could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }, [debounced, page, language]);

  useEffect(() => {
    void load();
  }, [load]);

  const tr = language === "tr";

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex min-w-[16rem] flex-1 flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-white/72">
            {tr ? "İşleme göre filtrele" : "Filter by action"}
          </span>
          <TextInput
            value={action}
            onChange={(event) => setAction(event.target.value)}
            placeholder="user.status_change"
          />
        </label>
        <Pill tone="success" icon={<ShieldCheck size={13} />}>
          {tr ? "Salt okunur, değiştirilemez" : "Read-only, immutable"}
        </Pill>
      </Card>

      <AdminTable
        columns={[
          tr ? "Zaman" : "Time",
          tr ? "Aktör" : "Actor",
          tr ? "İşlem" : "Action",
          tr ? "Hedef" : "Target",
          tr ? "Değişiklik" : "Change",
          tr ? "Gerekçe" : "Reason"
        ]}
        loading={loading}
        error={error}
        empty={!loading && (data?.entries.length ?? 0) === 0}
        minWidth={900}
      >
        {data?.entries.map((entry) => (
          <AdminRow key={entry.id}>
            <AdminCell nowrap>{shortDate(entry.created_at, language)}</AdminCell>
            <AdminCell nowrap>
              {entry.actor_role ? adminRoleLabels[language][entry.actor_role] : "—"}
            </AdminCell>
            <AdminCell nowrap className="font-semibold text-white/86">
              {entry.action}
            </AdminCell>
            <AdminCell nowrap>
              {entry.target_type}
              {entry.target_id ? (
                <span className="ml-2 text-white/38">{entry.target_id.slice(0, 8)}…</span>
              ) : null}
            </AdminCell>
            <AdminCell className="max-w-[22rem]">
              <ChangeSummary before={entry.before_summary} after={entry.after_summary} />
            </AdminCell>
            <AdminCell className="max-w-[18rem]">
              <span className="line-clamp-2 block text-white/62">{entry.reason ?? "—"}</span>
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

/** Renders before → after for the fields that actually changed. */
function ChangeSummary({
  before,
  after
}: {
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}) {
  if (!before && !after) return <span className="text-white/38">—</span>;

  const keys = [...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])];
  if (keys.length === 0) return <span className="text-white/38">—</span>;

  return (
    <span className="flex flex-col gap-0.5">
      {keys.map((key) => (
        <span key={key} className="text-[12px] tabular-nums">
          <span className="text-white/44">{key}: </span>
          {before?.[key] !== undefined ? (
            <span className="text-jam-coral line-through">{String(before[key])}</span>
          ) : null}
          {after?.[key] !== undefined ? (
            <span className="ml-1.5 text-jam-success">{String(after[key])}</span>
          ) : null}
        </span>
      ))}
    </span>
  );
}
