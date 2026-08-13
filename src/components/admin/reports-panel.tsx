"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/language-provider";
import { AdminCell, AdminRow, AdminTable, Pagination, StatusPill } from "@/components/admin/admin-table";
import { Button } from "@/components/ui/button";
import { Field, NativeSelect, TextArea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Card } from "@/components/ui/surface";
import { adminFetch, AdminRequestError } from "@/lib/admin-client";
import { shortDate } from "@/lib/format";
import {
  reportCategoryLabels,
  reportPriorityLabels,
  reportStatusLabels,
  type ReportCategory,
  type ReportPriority,
  type ReportStatus
} from "@/lib/reports";

type Report = {
  id: string;
  reported_by: string | null;
  target_type: string;
  target_id: string;
  category: string;
  reason: string;
  status: ReportStatus;
  priority: ReportPriority;
  resolution: string | null;
  created_at: string;
  resolved_at: string | null;
};

type Response = { reports: Report[]; total: number; page: number; pageSize: number };

const statusFilters: (ReportStatus | "")[] = ["", "pending", "reviewing", "resolved", "dismissed"];

export function ReportsPanel() {
  const { language } = useI18n();
  const [status, setStatus] = useState<ReportStatus | "">("pending");
  const [page, setPage] = useState(0);
  const [data, setData] = useState<Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<Report | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (status) params.set("status", status);
      setData(await adminFetch<Response>(`/api/admin/reports?${params}`));
    } catch (requestError) {
      setError(
        requestError instanceof AdminRequestError
          ? requestError.message
          : language === "tr"
            ? "Raporlar yüklenemedi."
            : "Reports could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }, [status, page, language]);

  useEffect(() => {
    void load();
  }, [load]);

  const tr = language === "tr";

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-wrap gap-1.5">
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
            {value ? reportStatusLabels[language][value] : tr ? "Tümü" : "All"}
          </button>
        ))}
      </Card>

      <AdminTable
        columns={[
          tr ? "Öncelik" : "Priority",
          tr ? "Hedef" : "Target",
          tr ? "Sebep" : "Category",
          tr ? "Açıklama" : "Description",
          tr ? "Durum" : "Status",
          tr ? "Tarih" : "Created",
          ""
        ]}
        loading={loading}
        error={error}
        empty={!loading && (data?.reports.length ?? 0) === 0}
      >
        {data?.reports.map((report) => (
          <AdminRow key={report.id}>
            <AdminCell nowrap>
              <StatusPill
                value={report.priority}
                label={reportPriorityLabels[language][report.priority]}
              />
            </AdminCell>
            <AdminCell nowrap>
              <span className="font-semibold text-white/82">{report.target_type}</span>
              <span className="ml-2 text-white/38">{report.target_id.slice(0, 8)}…</span>
            </AdminCell>
            <AdminCell nowrap>
              {reportCategoryLabels[language][report.category as ReportCategory] ?? report.category}
            </AdminCell>
            <AdminCell className="max-w-[26rem]">
              <span className="line-clamp-2 block">{report.reason}</span>
            </AdminCell>
            <AdminCell nowrap>
              <StatusPill value={report.status} label={reportStatusLabels[language][report.status]} />
            </AdminCell>
            <AdminCell nowrap>{shortDate(report.created_at, language)}</AdminCell>
            <AdminCell nowrap>
              <Button size="sm" variant="secondary" onClick={() => setActive(report)}>
                {tr ? "İncele" : "Review"}
              </Button>
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

      <ResolveReportModal
        report={active}
        onClose={() => setActive(null)}
        onResolved={() => {
          setActive(null);
          void load();
        }}
      />
    </div>
  );
}

function ResolveReportModal({
  report,
  onClose,
  onResolved
}: {
  report: Report | null;
  onClose: () => void;
  onResolved: () => void;
}) {
  const { language } = useI18n();
  const [status, setStatus] = useState<ReportStatus>("reviewing");
  const [resolution, setResolution] = useState("");
  const [action, setAction] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (report) {
      setStatus(report.status === "pending" ? "reviewing" : report.status);
      setResolution(report.resolution ?? "");
      setAction("");
      setError(null);
    }
  }, [report]);

  const tr = language === "tr";
  const requiresResolution = status === "resolved" || status === "dismissed";

  async function submit() {
    if (busy || !report) return;
    if (requiresResolution && resolution.trim().length < 3) {
      setError(tr ? "Bir karar notu gerekli." : "A resolution note is required.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await adminFetch("/api/admin/reports", {
        method: "PATCH",
        body: JSON.stringify({
          reportId: report.id,
          status,
          resolution: resolution.trim() || null,
          resolutionAction: action.trim() || null
        })
      });
      onResolved();
    } catch (requestError) {
      setError(
        requestError instanceof AdminRequestError
          ? requestError.message
          : tr
            ? "Rapor güncellenemedi."
            : "The report could not be updated."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={report !== null}
      onClose={onClose}
      busy={busy}
      size="lg"
      title={tr ? "Raporu incele" : "Review report"}
      description={
        tr
          ? "Karar denetim kaydına aktör ve gerekçeyle birlikte yazılır."
          : "The decision is written to the audit log with the actor and reason."
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            {tr ? "Kapat" : "Close"}
          </Button>
          <Button onClick={submit} loading={busy}>
            {tr ? "Kaydet" : "Save"}
          </Button>
        </>
      }
    >
      {report ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-white/8 bg-black/24 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-white/40">
              {tr ? "Bildirim" : "Report"}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-[13px] leading-6 text-white/78">
              {report.reason}
            </p>
          </div>

          <Field label={tr ? "Durum" : "Status"} htmlFor="resolve-status">
            <NativeSelect
              id="resolve-status"
              value={status}
              onChange={(event) => setStatus(event.target.value as ReportStatus)}
            >
              {(["reviewing", "resolved", "dismissed"] as ReportStatus[]).map((value) => (
                <option key={value} value={value}>
                  {reportStatusLabels[language][value]}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field
            label={tr ? "Alınan aksiyon" : "Action taken"}
            htmlFor="resolve-action"
            hint={tr ? "Örn. ilan askıya alındı, uyarı gönderildi." : "e.g. listing suspended, warning sent."}
          >
            <TextArea
              id="resolve-action"
              rows={2}
              value={action}
              onChange={(event) => setAction(event.target.value)}
            />
          </Field>

          <Field
            label={tr ? "Karar notu" : "Resolution note"}
            htmlFor="resolve-note"
            required={requiresResolution}
            error={error}
          >
            <TextArea
              id="resolve-note"
              rows={3}
              value={resolution}
              invalid={Boolean(error)}
              onChange={(event) => setResolution(event.target.value)}
            />
          </Field>
        </div>
      ) : null}
    </Modal>
  );
}
