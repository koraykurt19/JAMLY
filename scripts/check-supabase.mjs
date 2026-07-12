import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

loadDotEnvLocal();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseKey) {
  console.log(JSON.stringify({ ok: true, status: "not_configured" }, null, 2));
  process.exit(0);
}

const headers = {
  apikey: supabaseKey,
  Authorization: `Bearer ${supabaseKey}`
};

const auth = await request(`${supabaseUrl}/auth/v1/settings`, { headers: { apikey: supabaseKey } });
const profiles = await request(`${supabaseUrl}/rest/v1/profiles?select=id&limit=1`, { headers });

const schemaMissing =
  profiles.status === 404 ||
  profiles.body.includes("PGRST205") ||
  profiles.body.includes("schema cache");

const result = {
  ok: auth.ok && profiles.ok,
  auth: auth.ok ? "ready" : `http_${auth.status}`,
  database: profiles.ok ? "ready" : schemaMissing ? "schema_missing" : `http_${profiles.status}`
};

console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);

async function request(url, init) {
  try {
    const response = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(8000)
    });
    return {
      ok: response.ok,
      status: response.status,
      body: (await response.text()).slice(0, 500)
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      body: error instanceof Error ? error.message : "Request failed"
    };
  }
}

function loadDotEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}
