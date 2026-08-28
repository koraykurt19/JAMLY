import { existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

loadEnv(resolve(process.cwd(), ".env.local"));
loadEnv(resolve(process.cwd(), ".env.production.local"));

const execute = process.argv.includes("--execute");
const confirmIndex = process.argv.indexOf("--confirm");
const confirm = confirmIndex >= 0 ? process.argv[confirmIndex + 1] : "";
const databaseUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
const logDir = resolve(process.cwd(), "work", "retention-runs");

if (!databaseUrl) {
  console.error("Missing SUPABASE_DATABASE_URL or DATABASE_URL. No retention cleanup was run.");
  process.exit(1);
}

if (execute && confirm !== "RUN_RETENTION_CLEANUP") {
  console.error("Execute mode requires: --execute --confirm RUN_RETENTION_CLEANUP");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }
});

try {
  await client.connect();
  await client.query("begin");

  const actorId = await resolveActorId();
  await client.query("select set_config('request.jwt.claim.sub', $1, true)", [actorId]);
  await client.query("select set_config('role', 'authenticated', true)");

  const { rows } = await client.query("select public.admin_retention_plan($1) as plan", [
    execute
  ]);
  const plan = rows[0]?.plan;

  if (execute) {
    await client.query("commit");
  } else {
    await client.query("rollback");
  }

  mkdirSync(logDir, { recursive: true });
  const report = {
    checkedAt: new Date().toISOString(),
    mode: execute ? "execute" : "dry_run",
    eligibleRows: Number(plan?.totals?.eligibleRows ?? 0),
    deletedRows: Number(plan?.totals?.deletedRows ?? 0),
    policies: plan?.policies?.length ?? 0,
    protectsProfiles: Boolean(plan?.neverDelete?.includes("profiles")),
    neverDelete: plan?.neverDelete ?? []
  };
  const fileName = `${report.checkedAt.replace(/[:.]/g, "-")}-${report.mode}.json`;
  writeFileSync(resolve(logDir, fileName), JSON.stringify({ ...report, plan }, null, 2));

  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  await client.query("rollback").catch(() => undefined);
  console.error(error instanceof Error ? error.message : "Retention cleanup failed.");
  process.exitCode = 1;
} finally {
  await client.end().catch(() => undefined);
}

async function resolveActorId() {
  const configured = process.env.RETENTION_ADMIN_PROFILE_ID?.trim();
  if (configured) return configured;

  const { rows } = await client.query(`
    select a.user_id
    from public.admin_accounts a
    join public.profiles p on p.id = a.user_id
    where a.is_active
      and a.role = 'super_admin'
      and p.account_status = 'active'
    order by a.created_at
    limit 1
  `);

  const actorId = rows[0]?.user_id;
  if (!actorId) {
    throw new Error("No active super admin account found for retention execution.");
  }
  return actorId;
}

function loadEnv(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();
    const value =
      (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
      (rawValue.startsWith("'") && rawValue.endsWith("'"))
        ? rawValue.slice(1, -1)
        : rawValue;
    if (!process.env[key]) process.env[key] = value;
  }
}
