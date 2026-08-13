import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export class AdminApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export type AdminSupabaseClient = ReturnType<typeof createAdminSupabaseClient>;

export async function requireAdmin(request: Request) {
  const token = getBearerToken(request);
  if (!token) {
    throw new AdminApiError(401, "missing_token", "Authentication is required.");
  }

  const client = createAdminSupabaseClient(token);
  const {
    data: { user },
    error: userError
  } = await client.auth.getUser(token);

  if (userError || !user) {
    throw new AdminApiError(401, "invalid_token", "The session is no longer valid.");
  }

  const { data: isAdmin, error: adminError } = await client.rpc("is_current_user_admin");

  if (adminError) {
    throw new AdminApiError(
      isSchemaSetupError(adminError.message) ? 503 : 403,
      isSchemaSetupError(adminError.message) ? "admin_setup_required" : "admin_check_failed",
      adminError.message
    );
  }

  if (!isAdmin) {
    throw new AdminApiError(403, "admin_required", "Admin access is required.");
  }

  return { client, user };
}

/**
 * Requires a specific capability, not just "is an admin". Menu hiding is not
 * authorization — every privileged route calls this and the database enforces
 * the same rule again through `admin_has` inside its RPCs.
 */
export async function requireCapability(request: Request, capability: string) {
  const context = await requireAdmin(request);

  const { data: allowed, error } = await context.client.rpc("admin_has", {
    p_capability: capability
  });

  if (error) {
    throw new AdminApiError(
      isSchemaSetupError(error.message) ? 503 : 403,
      isSchemaSetupError(error.message) ? "admin_setup_required" : "capability_check_failed",
      error.message
    );
  }

  if (!allowed) {
    throw new AdminApiError(
      403,
      "capability_required",
      `This action requires the ${capability} capability.`
    );
  }

  return context;
}

/** Reads the caller's admin role so the UI can render the right surface. */
export async function getAdminRole(request: Request) {
  const context = await requireAdmin(request);
  const { data } = await context.client.rpc("current_admin_role");
  return { ...context, role: data ?? null };
}

export function adminErrorResponse(error: unknown) {
  if (error instanceof AdminApiError) {
    return Response.json(
      { error: error.code, message: publicAdminMessage(error) },
      { status: error.status, headers: noStoreHeaders() }
    );
  }

  if (error instanceof Error && isSchemaSetupError(error.message)) {
    return Response.json(
      {
        error: "admin_setup_required",
        message: "Admin database migration has not been applied yet."
      },
      { status: 503, headers: noStoreHeaders() }
    );
  }

  return Response.json(
    { error: "admin_request_failed", message: "The admin request could not be completed." },
    { status: 500, headers: noStoreHeaders() }
  );
}

export function noStoreHeaders() {
  return { "Cache-Control": "no-store" };
}

export function assertUuid(value: string, field = "id") {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new AdminApiError(400, "invalid_id", `${field} must be a UUID.`);
  }
}

/**
 * Strips everything that could break out of a PostgREST `.or()` filter
 * expression — notably commas and parentheses — before interpolation.
 *
 * Trims again at the end: replacing a trailing metacharacter with a space
 * previously left the padding in place, so "foo(bar)" became "foo bar ".
 */
export function sanitizeSearch(value: string | null) {
  return (
    value
      ?.replace(/[^a-zA-Z0-9@.\-\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80) ?? ""
  );
}

function createAdminSupabaseClient(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    throw new AdminApiError(503, "supabase_not_configured", "Supabase is not configured.");
  }

  return createClient<Database>(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
}

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? "";
}

function isSchemaSetupError(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("could not find the function") ||
    normalized.includes("schema cache") ||
    normalized.includes("does not exist") ||
    normalized.includes("pgrst202") ||
    normalized.includes("pgrst205")
  );
}

function publicAdminMessage(error: AdminApiError) {
  if (error.code === "admin_setup_required") {
    return "Admin database migration has not been applied yet.";
  }
  if (error.status === 401) {
    return "Please sign in again.";
  }
  if (error.status === 403) {
    return "This account does not have admin access.";
  }
  if (error.status === 503) {
    return "Admin services are not available in this environment.";
  }
  return error.message;
}
