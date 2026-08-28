export type OpsRunHealthInput = {
  checkedAtMs?: number;
  retentionRuns: Array<{
    mode: "dry_run" | "execute" | string;
    status: "completed" | "failed" | string;
    created_at: string;
    error_message?: string | null;
  }>;
  storageAudit: {
    checkedAt?: string | null;
    error?: string | null;
  } | null;
  maxRetentionAgeHours?: number;
  maxStorageAgeHours?: number;
};

export type OpsRunHealth = {
  status: "ok" | "warning" | "critical";
  retention: OpsRunSignal;
  storage: OpsRunSignal;
};

export type OpsRunSignal = {
  status: "ok" | "warning" | "critical";
  ageHours: number | null;
  message: string;
};

export function opsRunHealth(input: OpsRunHealthInput): OpsRunHealth {
  const nowMs = input.checkedAtMs ?? Date.now();
  const retention = retentionSignal(input.retentionRuns, nowMs, input.maxRetentionAgeHours ?? 30);
  const storage = storageSignal(input.storageAudit, nowMs, input.maxStorageAgeHours ?? 30);

  return {
    status: worstStatus([retention.status, storage.status]),
    retention,
    storage
  };
}

function retentionSignal(
  runs: OpsRunHealthInput["retentionRuns"],
  nowMs: number,
  maxAgeHours: number
): OpsRunSignal {
  const latest = [...runs].sort((left, right) => Date.parse(right.created_at) - Date.parse(left.created_at))[0];
  if (!latest) {
    return { status: "critical", ageHours: null, message: "No retention run has been recorded." };
  }
  const ageHours = hoursSince(latest.created_at, nowMs);
  if (latest.status === "failed") {
    return {
      status: "critical",
      ageHours,
      message: latest.error_message || "The latest retention run failed."
    };
  }
  if (ageHours === null || ageHours > maxAgeHours) {
    return {
      status: "warning",
      ageHours,
      message: "The latest retention run is stale."
    };
  }
  return { status: "ok", ageHours, message: "Retention cleanup is recent." };
}

function storageSignal(
  audit: OpsRunHealthInput["storageAudit"],
  nowMs: number,
  maxAgeHours: number
): OpsRunSignal {
  if (!audit?.checkedAt) {
    return { status: "warning", ageHours: null, message: "No storage audit report has been recorded." };
  }
  const ageHours = hoursSince(audit.checkedAt, nowMs);
  if (audit.error) {
    return { status: "critical", ageHours, message: audit.error };
  }
  if (ageHours === null || ageHours > maxAgeHours) {
    return { status: "warning", ageHours, message: "The latest storage audit is stale." };
  }
  return { status: "ok", ageHours, message: "Storage audit is recent." };
}

function hoursSince(value: string, nowMs: number) {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return null;
  return Math.max(0, Math.round(((nowMs - time) / (60 * 60 * 1000)) * 10) / 10);
}

function worstStatus(statuses: Array<OpsRunSignal["status"]>) {
  if (statuses.includes("critical")) return "critical";
  if (statuses.includes("warning")) return "warning";
  return "ok";
}
