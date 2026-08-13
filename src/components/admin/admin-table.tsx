"use client";

import type { ReactNode } from "react";
import { AlertCircle, Inbox, Loader2 } from "lucide-react";
import { cn } from "@/lib/format";

/**
 * Shared admin table shell.
 *
 * Wide tables scroll inside their own container rather than pushing the page
 * sideways, and every table renders explicit loading / empty / error states so
 * an operator can always tell "no results" from "failed to load".
 */
export function AdminTable({
  columns,
  children,
  loading,
  error,
  empty,
  minWidth = 760
}: {
  columns: string[];
  children: ReactNode;
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  minWidth?: number;
}) {
  if (error) {
    return (
      <div
        role="alert"
        className="flex items-center gap-3 rounded-lg border border-jam-danger/28 bg-jam-danger/10 p-5"
      >
        <AlertCircle size={18} className="shrink-0 text-jam-danger" />
        <p className="text-sm text-white/80">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 rounded-lg border border-white/8 bg-jam-surface/60 py-16">
        <Loader2 size={18} className="animate-spin text-white/44" />
        <span className="text-sm text-white/56">Yükleniyor…</span>
      </div>
    );
  }

  if (empty) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-white/12 py-16 text-center">
        <Inbox size={22} className="text-white/28" />
        <p className="text-sm text-white/56">Kayıt bulunamadı.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-white/8">
      <table className="w-full border-collapse text-left" style={{ minWidth }}>
        <thead>
          <tr className="border-b border-white/8 bg-white/[0.03]">
            {columns.map((column) => (
              <th
                key={column}
                scope="col"
                className="whitespace-nowrap px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white/44"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function AdminRow({ children }: { children: ReactNode }) {
  return <tr className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.02]">{children}</tr>;
}

export function AdminCell({
  children,
  className,
  nowrap
}: {
  children: ReactNode;
  className?: string;
  nowrap?: boolean;
}) {
  return (
    <td
      className={cn(
        "px-4 py-3 align-middle text-[13px] text-white/74",
        nowrap && "whitespace-nowrap",
        className
      )}
    >
      {children}
    </td>
  );
}

const statusTones: Record<string, string> = {
  active: "border-jam-success/28 bg-jam-success/12 text-jam-success",
  verified: "border-jam-success/28 bg-jam-success/12 text-jam-success",
  resolved: "border-jam-success/28 bg-jam-success/12 text-jam-success",
  paid: "border-jam-success/28 bg-jam-success/12 text-jam-success",
  converted: "border-jam-success/28 bg-jam-success/12 text-jam-success",

  pending: "border-jam-warning/28 bg-jam-warning/12 text-jam-warning",
  reviewing: "border-jam-warning/28 bg-jam-warning/12 text-jam-warning",
  suspended: "border-jam-warning/28 bg-jam-warning/12 text-jam-warning",
  unpaid: "border-jam-warning/28 bg-jam-warning/12 text-jam-warning",
  invited: "border-jam-blue/28 bg-jam-blue/12 text-jam-mint",

  banned: "border-jam-danger/28 bg-jam-danger/12 text-jam-danger",
  blocked: "border-jam-danger/28 bg-jam-danger/12 text-jam-danger",
  urgent: "border-jam-danger/28 bg-jam-danger/12 text-jam-danger",
  failed: "border-jam-danger/28 bg-jam-danger/12 text-jam-danger",

  dismissed: "border-white/12 bg-white/[0.06] text-white/60",
  suppressed: "border-white/12 bg-white/[0.06] text-white/60"
};

/** Status pill with a single tone map, replacing per-file emerald/amber/rose. */
export function StatusPill({ value, label }: { value: string; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-pill border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
        statusTones[value] ?? "border-white/12 bg-white/[0.06] text-white/68"
      )}
    >
      {label ?? value}
    </span>
  );
}

export function Pagination({
  page,
  total,
  pageSize,
  onPageChange
}: {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (next: number) => void;
}) {
  const from = total === 0 ? 0 : page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, total);
  const hasPrevious = page > 0;
  const hasNext = to < total;

  if (total === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
      <p className="text-[13px] text-white/50">
        {from}–{to} / {total}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!hasPrevious}
          onClick={() => onPageChange(page - 1)}
          className="focus-ring min-h-control-sm rounded-md border border-white/12 px-3 text-[13px] font-semibold text-white/72 transition hover:bg-white/[0.06] disabled:opacity-38"
        >
          Önceki
        </button>
        <button
          type="button"
          disabled={!hasNext}
          onClick={() => onPageChange(page + 1)}
          className="focus-ring min-h-control-sm rounded-md border border-white/12 px-3 text-[13px] font-semibold text-white/72 transition hover:bg-white/[0.06] disabled:opacity-38"
        >
          Sonraki
        </button>
      </div>
    </div>
  );
}
