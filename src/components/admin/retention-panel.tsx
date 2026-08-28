"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArchiveX,
  DatabaseZap,
  HardDrive,
  Loader2,
  Play,
  RefreshCw,
  ShieldCheck
} from "lucide-react";
import { useI18n } from "@/components/language-provider";
import { AdminCell, AdminRow, AdminTable, StatusPill } from "@/components/admin/admin-table";
import { Card, Pill } from "@/components/ui/surface";
import { adminFetch, AdminRequestError } from "@/lib/admin-client";

type RetentionPolicy = {
  key: string;
  label: string;
  retentionDays: number;
  premiumRetentionDays: number;
  eligibleRows: number;
  deletedRows: number;
  protects: string[];
};

type RetentionPlan = {
  runId: string;
  mode: "dry_run" | "execute";
  generatedAt: string;
  totals: {
    eligibleRows: number;
    deletedRows: number;
  };
  policies: RetentionPolicy[];
  neverDelete: string[];
};

type RetentionRun = {
  id: string;
  mode: "dry_run" | "execute";
  status: "completed" | "failed";
  summary: {
    totals?: {
      eligibleRows?: number;
      deletedRows?: number;
    };
  } | null;
  error_message: string | null;
  created_at: string;
};

type StorageAuditBucket = {
  bucket?: string;
  objects?: number;
  protectedObjects?: number;
  orphanObjects?: number;
  deletionCandidates?: number;
  totalBytes?: number;
  orphanBytes?: number;
  deletionCandidateBytes?: number;
};

type StorageAudit = {
  fileName: string;
  checkedAt: string;
  mode: "dry_run" | "execute";
  orphanGraceDays: number;
  inspectedObjects: number;
  protectedObjects: number;
  orphanObjects: number;
  deletionCandidates: number;
  orphanBytes: number;
  deletionCandidateBytes: number;
  deletedObjects: number;
  deletedBytes: number;
  buckets: StorageAuditBucket[];
  error?: string;
};

type OpsRunSignal = {
  status: "ok" | "warning" | "critical";
  ageHours: number | null;
  message: string;
};

type OpsRunHealth = {
  status: "ok" | "warning" | "critical";
  retention: OpsRunSignal;
  storage: OpsRunSignal;
};

type RetentionResponse = {
  plan: RetentionPlan;
  runs: RetentionRun[];
  storageAudit: StorageAudit | null;
  health: OpsRunHealth;
};

export function RetentionPanel() {
  const { language } = useI18n();
  const tr = language === "tr";
  const [plan, setPlan] = useState<RetentionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [runs, setRuns] = useState<RetentionRun[]>([]);
  const [storageAudit, setStorageAudit] = useState<StorageAudit | null>(null);
  const [health, setHealth] = useState<OpsRunHealth | null>(null);

  const canExecute = confirm === "RUN_RETENTION_CLEANUP" && !executing;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminFetch<RetentionResponse>("/api/admin/retention");
      setPlan(response.plan);
      setRuns(response.runs ?? []);
      setStorageAudit(response.storageAudit ?? null);
      setHealth(response.health ?? null);
    } catch (requestError) {
      setError(readError(requestError, tr));
    } finally {
      setLoading(false);
    }
  }, [tr]);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = useMemo(() => plan?.policies ?? [], [plan]);

  async function executeRetention() {
    if (!canExecute) return;
    setExecuting(true);
    setError(null);
    try {
      const response = await adminFetch<RetentionResponse>("/api/admin/retention", {
        method: "POST",
        body: JSON.stringify({ confirm })
      });
      setPlan(response.plan);
      setRuns(response.runs ?? []);
      setStorageAudit(response.storageAudit ?? null);
      setHealth(response.health ?? null);
      setConfirm("");
    } catch (requestError) {
      setError(readError(requestError, tr));
    } finally {
      setExecuting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {health ? <OpsHealthBand health={health} tr={tr} /> : null}

      <Card className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-10 items-center justify-center rounded-md bg-jam-blue/12 text-jam-mint">
              <DatabaseZap size={19} />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {tr ? "Veri koruma ve temizlik" : "Data retention cleanup"}
              </h2>
              <p className="mt-1 text-sm leading-6 text-white/56">
                {tr
                  ? "Geçici kayıtları temizler; profil, sipariş, ödeme, rozet ve admin audit verisine dokunmaz."
                  : "Prunes ephemeral rows without touching profiles, orders, payments, badges, or admin audit data."}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Metric
              label={tr ? "Silinebilir satır" : "Eligible rows"}
              value={String(plan?.totals.eligibleRows ?? 0)}
            />
            <Metric
              label={tr ? "Son çalıştırmada silinen" : "Deleted in last run"}
              value={String(plan?.totals.deletedRows ?? 0)}
            />
            <Metric
              label={tr ? "Mod" : "Mode"}
              value={plan?.mode === "execute" ? (tr ? "Temizlik" : "Execute") : "Dry-run"}
            />
          </div>
        </div>

        <div className="rounded-lg border border-white/8 bg-black/20 p-4">
          <div className="flex items-start gap-2 text-xs leading-5 text-white/56">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-jam-mint" />
            <span>
              {tr
                ? "Premium hesaplarda desteklenen geçici veriler iki kat uzun tutulur. Varsayılan plan standarttır."
                : "Supported ephemeral data is kept twice as long for premium accounts. The default plan is standard."}
            </span>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading || executing}
            className="focus-ring mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-white/12 px-3 text-sm font-semibold text-white/70 transition hover:bg-white/[0.06] disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            {tr ? "Dry-run yenile" : "Refresh dry-run"}
          </button>
        </div>
      </Card>

      <AdminTable
        columns={[
          tr ? "Alan" : "Area",
          tr ? "Standart" : "Standard",
          "Premium",
          tr ? "Silinebilir" : "Eligible",
          tr ? "Silinen" : "Deleted",
          tr ? "Korunan" : "Protected"
        ]}
        loading={loading}
        error={error}
        empty={!loading && rows.length === 0}
        minWidth={920}
      >
        {rows.map((policy) => (
          <AdminRow key={policy.key}>
            <AdminCell className="font-semibold text-white/82">{policy.label}</AdminCell>
            <AdminCell nowrap>{policy.retentionDays} gün</AdminCell>
            <AdminCell nowrap>{policy.premiumRetentionDays} gün</AdminCell>
            <AdminCell nowrap className="font-bold tabular-nums text-jam-mint">
              {policy.eligibleRows}
            </AdminCell>
            <AdminCell nowrap className="tabular-nums">
              {policy.deletedRows}
            </AdminCell>
            <AdminCell>
              <div className="flex flex-wrap gap-1.5">
                {policy.protects.map((item) => (
                  <Pill key={item}>{item}</Pill>
                ))}
              </div>
            </AdminCell>
          </AdminRow>
        ))}
      </AdminTable>

      <Card>
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-md bg-white/[0.06] text-jam-mint">
                <HardDrive size={17} />
              </span>
              <h2 className="text-lg font-semibold text-white">
                {tr ? "Storage maliyet sinyali" : "Storage cost signal"}
              </h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-white/50">
              {tr
                ? "Son storage audit raporu; referansli dosyalari korur, yalnizca eski orphan adaylari isaretler."
                : "Latest storage audit report; referenced files stay protected, only old orphan candidates are flagged."}
            </p>
          </div>
          <Pill tone={storageAudit?.deletionCandidates ? "warning" : "success"}>
            {storageAudit ? formatDate(storageAudit.checkedAt, language) : tr ? "Rapor yok" : "No report"}
          </Pill>
        </div>

        {storageAudit ? (
          <>
            <div className="grid gap-3 md:grid-cols-4">
              <Metric label={tr ? "Incelenen nesne" : "Inspected objects"} value={String(storageAudit.inspectedObjects)} />
              <Metric label={tr ? "Korunan nesne" : "Protected objects"} value={String(storageAudit.protectedObjects)} />
              <Metric label={tr ? "Orphan nesne" : "Orphan objects"} value={String(storageAudit.orphanObjects)} />
              <Metric
                label={tr ? "Silinebilir alan" : "Prunable bytes"}
                value={formatBytes(storageAudit.deletionCandidateBytes)}
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-white/48">
              <Pill tone={storageAudit.mode === "execute" ? "warning" : "brand"}>
                {storageAudit.mode === "execute" ? (tr ? "Temizlik" : "Execute") : "Dry-run"}
              </Pill>
              <span>{tr ? "Grace:" : "Grace:"} {storageAudit.orphanGraceDays} gün</span>
              <span>{storageAudit.fileName}</span>
              {storageAudit.error ? <span className="text-jam-danger">{storageAudit.error}</span> : null}
            </div>

            <AdminTable
              columns={[
                "Bucket",
                tr ? "Nesne" : "Objects",
                tr ? "Korunan" : "Protected",
                "Orphan",
                tr ? "Aday" : "Candidates",
                tr ? "Toplam" : "Total",
                tr ? "Silinebilir" : "Prunable"
              ]}
              loading={false}
              error={null}
              empty={storageAudit.buckets.length === 0}
              minWidth={860}
            >
              {storageAudit.buckets.map((bucket) => (
                <AdminRow key={bucket.bucket ?? "unknown"}>
                  <AdminCell className="font-semibold text-white/82">{bucket.bucket ?? "-"}</AdminCell>
                  <AdminCell nowrap className="tabular-nums">{Number(bucket.objects ?? 0)}</AdminCell>
                  <AdminCell nowrap className="tabular-nums text-jam-mint">
                    {Number(bucket.protectedObjects ?? 0)}
                  </AdminCell>
                  <AdminCell nowrap className="tabular-nums">{Number(bucket.orphanObjects ?? 0)}</AdminCell>
                  <AdminCell nowrap className="font-bold tabular-nums text-jam-warning">
                    {Number(bucket.deletionCandidates ?? 0)}
                  </AdminCell>
                  <AdminCell nowrap>{formatBytes(Number(bucket.totalBytes ?? 0))}</AdminCell>
                  <AdminCell nowrap>{formatBytes(Number(bucket.deletionCandidateBytes ?? 0))}</AdminCell>
                </AdminRow>
              ))}
            </AdminTable>
          </>
        ) : (
          <div className="flex items-center gap-3 rounded-lg border border-dashed border-white/12 p-5 text-sm text-white/56">
            <ArchiveX size={18} className="text-white/36" />
            {tr
              ? "Henuz storage audit raporu yok. Zamanlanmis Jamly Storage Audit gorevi veya npm run storage:audit olusturur."
              : "No storage audit report yet. The scheduled Jamly Storage Audit task or npm run storage:audit creates it."}
          </div>
        )}
      </Card>

      <Card>
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {tr ? "Son temizlik calismalari" : "Recent retention runs"}
            </h2>
            <p className="mt-1 text-sm leading-6 text-white/50">
              {tr
                ? "Dry-run ve gercek temizlik kayitlari burada izlenir."
                : "Dry-run and execute records are tracked here."}
            </p>
          </div>
          <Pill tone="brand">{runs.length}</Pill>
        </div>

        <AdminTable
          columns={[
            tr ? "Zaman" : "Time",
            "Mode",
            tr ? "Durum" : "Status",
            tr ? "Silinebilir" : "Eligible",
            tr ? "Silinen" : "Deleted",
            tr ? "Hata" : "Error"
          ]}
          loading={loading}
          error={null}
          empty={!loading && runs.length === 0}
          minWidth={820}
        >
          {runs.map((run) => (
            <AdminRow key={run.id}>
              <AdminCell nowrap>{formatDate(run.created_at, language)}</AdminCell>
              <AdminCell nowrap>
                {run.mode === "execute" ? (tr ? "Temizlik" : "Execute") : "Dry-run"}
              </AdminCell>
              <AdminCell nowrap>
                <StatusPill value={run.status} />
              </AdminCell>
              <AdminCell nowrap className="tabular-nums">
                {Number(run.summary?.totals?.eligibleRows ?? 0)}
              </AdminCell>
              <AdminCell nowrap className="font-bold tabular-nums text-jam-mint">
                {Number(run.summary?.totals?.deletedRows ?? 0)}
              </AdminCell>
              <AdminCell className="max-w-[18rem] truncate text-white/54">
                {run.error_message ?? "-"}
              </AdminCell>
            </AdminRow>
          ))}
        </AdminTable>
      </Card>

      <Card className="border-jam-warning/24 bg-jam-warning/[0.055]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-jam-warning">
              <AlertTriangle size={18} />
              <h2 className="text-sm font-bold uppercase tracking-[0.12em]">
                {tr ? "Kontrollü temizlik" : "Controlled cleanup"}
              </h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-white/62">
              {tr
                ? "Çalıştırmadan önce dry-run sayısını kontrol et. Devam etmek için kutuya RUN_RETENTION_CLEANUP yaz."
                : "Review the dry-run count first. Type RUN_RETENTION_CLEANUP to continue."}
            </p>
            <p className="mt-2 text-xs leading-5 text-white/42">
              {tr ? "Asla silinmeyenler: " : "Never deleted: "}
              {plan?.neverDelete.join(", ") ?? "profiles, orders, payments, admin audit"}
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 lg:w-80">
            <input
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              placeholder="RUN_RETENTION_CLEANUP"
              className="focus-ring h-11 rounded-md border border-white/10 bg-black/28 px-3 text-sm font-semibold text-white outline-none"
            />
            <button
              type="button"
              onClick={() => void executeRetention()}
              disabled={!canExecute}
              className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-jam-warning px-4 text-sm font-bold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
            >
              {executing ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              {tr ? "Temizliği çalıştır" : "Run cleanup"}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function OpsHealthBand({ health, tr }: { health: OpsRunHealth; tr: boolean }) {
  return (
    <Card className={healthClass(health.status)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-white/50">
            {tr ? "Operasyon sagligi" : "Operational health"}
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white">
            {health.status === "ok"
              ? tr
                ? "Retention ve storage takibi taze"
                : "Retention and storage checks are fresh"
              : health.status === "critical"
                ? tr
                  ? "Acil kontrol gerekiyor"
                  : "Immediate review required"
                : tr
                  ? "Takip uyarisi var"
                  : "Monitoring warning"}
          </h2>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[34rem]">
          <OpsHealthItem label={tr ? "Retention" : "Retention"} signal={health.retention} />
          <OpsHealthItem label="Storage" signal={health.storage} />
        </div>
      </div>
    </Card>
  );
}

function OpsHealthItem({ label, signal }: { label: string; signal: OpsRunSignal }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/18 px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-bold text-white">{label}</span>
        <Pill tone={signal.status === "ok" ? "success" : signal.status === "critical" ? "danger" : "warning"}>
          {signal.status}
        </Pill>
      </div>
      <p className="mt-1 text-xs leading-5 text-white/50">
        {signal.ageHours === null ? "age: -" : `age: ${signal.ageHours}h`} / {signal.message}
      </p>
    </div>
  );
}

function healthClass(status: OpsRunHealth["status"]) {
  if (status === "critical") return "border-jam-danger/26 bg-jam-danger/[0.07]";
  if (status === "warning") return "border-jam-warning/26 bg-jam-warning/[0.06]";
  return "border-jam-mint/20 bg-jam-mint/[0.045]";
}

function formatDate(value: string, language: "tr" | "en") {
  if (!value) return "-";
  return new Intl.DateTimeFormat(language === "tr" ? "tr-TR" : "en-US", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let amount = value;
  let unitIndex = 0;
  while (amount >= 1024 && unitIndex < units.length - 1) {
    amount /= 1024;
    unitIndex += 1;
  }
  return `${amount >= 10 || unitIndex === 0 ? amount.toFixed(0) : amount.toFixed(1)} ${units[unitIndex]}`;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/8 bg-black/20 p-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/36">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-white">{value}</p>
    </div>
  );
}

function readError(error: unknown, tr: boolean) {
  if (error instanceof AdminRequestError) return error.message;
  return tr ? "Veri koruma planı yüklenemedi." : "The retention plan could not be loaded.";
}
