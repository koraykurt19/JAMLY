import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/format";

/**
 * The repeated "panel" container used across dashboards, admin and detail
 * pages. Replaces the copy-pasted border/background className strings.
 */
export function Card({
  as: Tag = "div",
  className,
  children,
  padded = true
}: {
  as?: ElementType;
  className?: string;
  children: ReactNode;
  padded?: boolean;
}) {
  return (
    <Tag
      className={cn(
        "rounded-lg border border-white/8 bg-jam-surface/72",
        padded && "p-5",
        className
      )}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({
  title,
  description,
  action,
  className
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-white">{title}</h2>
        {description ? (
          <p className="mt-1 text-[13px] leading-6 text-content-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

type BadgeTone = "neutral" | "brand" | "success" | "warning" | "danger" | "gold";

const badgeToneClass: Record<BadgeTone, string> = {
  neutral: "border-white/12 bg-white/[0.06] text-white/76",
  brand: "border-jam-blue/32 bg-jam-blue/14 text-jam-mint",
  success: "border-jam-success/32 bg-jam-success/12 text-jam-success",
  warning: "border-jam-warning/32 bg-jam-warning/12 text-jam-warning",
  danger: "border-jam-danger/32 bg-jam-danger/12 text-jam-danger",
  gold: "border-jam-gold/34 bg-jam-gold/12 text-jam-gold"
};

export function Pill({
  tone = "neutral",
  className,
  children,
  icon
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-[12px] font-semibold",
        badgeToneClass[tone],
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-md bg-white/[0.07]", className)}
    />
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-white/12 px-6 py-12 text-center">
      {icon ? <div className="text-white/32">{icon}</div> : null}
      <p className="text-sm font-semibold text-white/82">{title}</p>
      {description ? (
        <p className="max-w-sm text-[13px] leading-6 text-content-muted">{description}</p>
      ) : null}
      {action}
    </div>
  );
}

export function ErrorNotice({ title, message }: { title: string; message?: string | null }) {
  return (
    <div role="alert" className="rounded-lg border border-jam-danger/28 bg-jam-danger/10 p-5">
      <p className="text-sm font-semibold text-white">{title}</p>
      {message ? <p className="mt-1.5 text-[13px] leading-6 text-white/68">{message}</p> : null}
    </div>
  );
}
