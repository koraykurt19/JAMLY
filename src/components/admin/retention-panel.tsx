"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, DatabaseZap, Loader2, Play, RefreshCw, ShieldCheck } from "lucide-react";
import { useI18n } from "@/components/language-provider";
import { AdminCell, AdminRow, AdminTable } from "@/components/admin/admin-table";
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

type RetentionResponse = { plan: RetentionPlan };

export function RetentionPanel() {
  const { language } = useI18n();
  const tr = language === "tr";
  const [plan, setPlan] = useState<RetentionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canExecute = confirm === "RUN_RETENTION_CLEANUP" && !executing;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminFetch<RetentionResponse>("/api/admin/retention");
      setPlan(response.plan);
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
      setConfirm("");
    } catch (requestError) {
      setError(readError(requestError, tr));
    } finally {
      setExecuting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
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
