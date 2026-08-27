import { NextResponse, type NextRequest } from "next/server";

/**
 * HTTP Basic Auth gate for non-public deployments (staging, UAT, demos).
 *
 * Lives in the application rather than in IIS/nginx so the gate travels with
 * the app: the same build behaves identically on IIS, Vercel or a container,
 * and nobody has to create Windows accounts to let a tester in.
 *
 * Enabled only when STAGING_AUTH_USERS is set, so local development and a real
 * production deployment are unaffected by its presence.
 *
 * Credential format (one or more, comma separated):
 *   STAGING_AUTH_USERS="alice:<sha256-hex>,bob:<sha256-hex>"
 *
 * Only the hash is stored. Generate entries with:
 *   node scripts/generate-staging-credentials.mjs alice bob
 *
 * A plain SHA-256 is deliberate here: these passwords are generated with 128+
 * bits of entropy, so a slow KDF would buy nothing — there is no dictionary to
 * run against a random 24-character secret. Do NOT reuse this helper for
 * human-chosen passwords.
 *
 * Runs in the Edge runtime, so it uses Web Crypto only (no node:crypto).
 */

/** Paths that must stay reachable without a browser prompt. */
const EXEMPT_PREFIXES = [
  // Load balancer / uptime probes.
  "/api/health",
  // Payment providers cannot send Basic Auth credentials on a webhook.
  // It has its own HMAC signature check, which is the real protection.
  "/api/payments/webhook"
];

export async function enforceStagingAuth(request: NextRequest): Promise<NextResponse | null> {
  const configured = process.env.STAGING_AUTH_USERS?.trim();
  if (!configured) return null;

  const { pathname } = request.nextUrl;
  if (EXEMPT_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return null;

  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Basic\s+(.+)$/i);
  if (!match) return unauthorized();

  let decoded: string;
  try {
    decoded = atob(match[1].trim());
  } catch {
    return unauthorized();
  }

  // Split on the FIRST colon only: passwords may legitimately contain one.
  const separator = decoded.indexOf(":");
  if (separator < 0) return unauthorized();

  const username = decoded.slice(0, separator);
  const password = decoded.slice(separator + 1);

  const expectedHash = parseUsers(configured).get(username);
  if (!expectedHash) {
    // Hash anyway so a missing user and a wrong password cost the same time,
    // which stops the response latency from revealing valid usernames.
    await sha256Hex(password);
    return unauthorized();
  }

  const actualHash = await sha256Hex(password);
  if (!timingSafeEqual(actualHash, expectedHash)) return unauthorized();

  return null;
}

function parseUsers(configured: string) {
  const users = new Map<string, string>();
  for (const entry of configured.split(",")) {
    const separator = entry.indexOf(":");
    if (separator < 0) continue;
    const name = entry.slice(0, separator).trim();
    const hash = entry.slice(separator + 1).trim().toLowerCase();
    if (name && /^[0-9a-f]{64}$/.test(hash)) users.set(name, hash);
  }
  return users;
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Length-independent constant-time comparison of two hex strings. */
function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) {
    difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return difference === 0;
}

function unauthorized() {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Jamly test", charset="UTF-8"',
      "Cache-Control": "no-store",
      // A gated environment must never be indexed, even if a page leaks out.
      "X-Robots-Tag": "noindex, nofollow"
    }
  });
}
