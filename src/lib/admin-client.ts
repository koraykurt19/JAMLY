"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase";

/**
 * Shared fetch wrapper for /api/admin/*. Every admin route authenticates with
 * the caller's own bearer token, so RLS still applies underneath — the API
 * layer is defence in depth, not the only boundary.
 */
export class AdminRequestError extends Error {
  code: string;
  status: number;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const client = getSupabaseBrowserClient();
  if (!client) {
    throw new AdminRequestError(503, "not_configured", "Supabase is not configured.");
  }

  const {
    data: { session }
  } = await client.auth.getSession();

  if (!session?.access_token) {
    throw new AdminRequestError(401, "signed_out", "Please sign in again.");
  }

  const response = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
      Authorization: `Bearer ${session.access_token}`
    },
    cache: "no-store"
  });

  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (!response.ok) {
    throw new AdminRequestError(
      response.status,
      String(body.error ?? "request_failed"),
      String(body.message ?? "The admin request could not be completed.")
    );
  }

  return body as T;
}

export const adminCapabilities = [
  "admin.manage",
  "user.moderate",
  "user.view",
  "listing.moderate",
  "order.manage",
  "finance.view",
  "finance.manage",
  "report.resolve",
  "badge.manage",
  "waitlist.manage",
  "config.manage",
  "audit.view",
  "support.manage"
] as const;

export type AdminCapability = (typeof adminCapabilities)[number];

export type AdminRole =
  | "super_admin"
  | "admin"
  | "moderator"
  | "support"
  | "finance"
  | "content_reviewer"
  | "analyst";

/**
 * Mirrors `admin_capabilities()` in the database so the console can hide what
 * a role cannot do. The database re-checks every action regardless.
 */
export const roleCapabilities: Record<AdminRole, AdminCapability[]> = {
  super_admin: [...adminCapabilities],
  admin: [
    "user.moderate",
    "user.view",
    "listing.moderate",
    "order.manage",
    "finance.view",
    "report.resolve",
    "badge.manage",
    "waitlist.manage",
    "config.manage",
    "audit.view",
    "support.manage"
  ],
  moderator: ["user.view", "user.moderate", "listing.moderate", "report.resolve", "audit.view"],
  support: ["user.view", "order.manage", "support.manage", "report.resolve"],
  finance: ["user.view", "finance.view", "finance.manage", "order.manage", "audit.view"],
  content_reviewer: ["user.view", "listing.moderate", "report.resolve"],
  analyst: ["user.view", "finance.view", "audit.view"]
};

export function roleHas(role: AdminRole | null, capability: AdminCapability) {
  if (!role) return false;
  return roleCapabilities[role]?.includes(capability) ?? false;
}

export const adminRoleLabels: Record<"tr" | "en", Record<AdminRole, string>> = {
  tr: {
    super_admin: "Süper Yönetici",
    admin: "Yönetici",
    moderator: "Moderatör",
    support: "Destek",
    finance: "Finans",
    content_reviewer: "İçerik İnceleme",
    analyst: "Analist"
  },
  en: {
    super_admin: "Super Admin",
    admin: "Admin",
    moderator: "Moderator",
    support: "Support",
    finance: "Finance",
    content_reviewer: "Content Reviewer",
    analyst: "Analyst"
  }
};
