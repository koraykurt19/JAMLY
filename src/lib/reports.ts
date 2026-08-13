import type { Language } from "@/lib/i18n";

/** Report domain shared by the submission UI and the moderation queue. */

export const reportTargetTypes = [
  "user",
  "profile",
  "listing",
  "review",
  "message",
  "order"
] as const;
export type ReportTargetType = (typeof reportTargetTypes)[number];

export const reportCategories = [
  "copyright",
  "stolen_content",
  "spam",
  "harassment",
  "fraud",
  "explicit",
  "impersonation",
  "other"
] as const;
export type ReportCategory = (typeof reportCategories)[number];

export const reportStatuses = ["pending", "reviewing", "resolved", "dismissed"] as const;
export type ReportStatus = (typeof reportStatuses)[number];

export const reportPriorities = ["low", "normal", "high", "urgent"] as const;
export type ReportPriority = (typeof reportPriorities)[number];

export const reportCategoryLabels: Record<Language, Record<ReportCategory, string>> = {
  tr: {
    copyright: "Telif hakkı ihlali",
    stolen_content: "Çalıntı içerik",
    spam: "Spam veya yanıltıcı içerik",
    harassment: "Taciz veya nefret söylemi",
    fraud: "Dolandırıcılık",
    explicit: "Uygunsuz içerik",
    impersonation: "Kimlik taklidi",
    other: "Diğer"
  },
  en: {
    copyright: "Copyright infringement",
    stolen_content: "Stolen content",
    spam: "Spam or misleading content",
    harassment: "Harassment or hate speech",
    fraud: "Fraud",
    explicit: "Explicit content",
    impersonation: "Impersonation",
    other: "Other"
  }
};

export const reportStatusLabels: Record<Language, Record<ReportStatus, string>> = {
  tr: {
    pending: "Beklemede",
    reviewing: "İnceleniyor",
    resolved: "Çözüldü",
    dismissed: "Reddedildi"
  },
  en: {
    pending: "Pending",
    reviewing: "Reviewing",
    resolved: "Resolved",
    dismissed: "Dismissed"
  }
};

export const reportPriorityLabels: Record<Language, Record<ReportPriority, string>> = {
  tr: { low: "Düşük", normal: "Normal", high: "Yüksek", urgent: "Acil" },
  en: { low: "Low", normal: "Normal", high: "High", urgent: "Urgent" }
};

/**
 * Categories that imply real-world harm or legal exposure get escalated on
 * arrival rather than waiting for a moderator to triage the queue.
 */
export function defaultPriorityFor(category: ReportCategory): ReportPriority {
  if (category === "harassment" || category === "fraud") return "urgent";
  if (category === "copyright" || category === "stolen_content" || category === "impersonation") {
    return "high";
  }
  return "normal";
}

export type ReportSubmission = {
  targetType: ReportTargetType;
  targetId: string;
  category: ReportCategory;
  description: string;
};

export function validateReport(input: ReportSubmission) {
  const errors: string[] = [];
  if (!reportTargetTypes.includes(input.targetType)) errors.push("invalid_target_type");
  if (!input.targetId || input.targetId.length > 200) errors.push("invalid_target");
  if (!reportCategories.includes(input.category)) errors.push("invalid_category");

  const description = input.description?.trim() ?? "";
  if (description.length < 10) errors.push("description_too_short");
  if (description.length > 2000) errors.push("description_too_long");

  return errors;
}
