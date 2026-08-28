import { existsSync, readFileSync } from "node:fs";
import { resolve, sep } from "node:path";
import pg from "pg";

const migrationName = process.argv[2];

loadEnv(resolve(process.cwd(), ".env.local"));
loadEnv(resolve(process.cwd(), ".env.production.local"));

const databaseUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!migrationName || !/^[a-zA-Z0-9_-]+\.sql$/.test(migrationName)) {
  console.error("Usage: npm run supabase:apply-migration -- 20260801_ensure_listing_storage.sql");
  process.exit(1);
}

if (!databaseUrl) {
  console.error("Missing SUPABASE_DATABASE_URL or DATABASE_URL. No migration was applied.");
  process.exit(1);
}

const migrationsDirectory = resolve(process.cwd(), "supabase", "migrations");
const migrationPath = resolve(migrationsDirectory, migrationName);
if (!migrationPath.startsWith(`${migrationsDirectory}${sep}`) || !existsSync(migrationPath)) {
  console.error("Migration file was not found.");
  process.exit(1);
}

const sql = readFileSync(migrationPath, "utf8");
const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }
});

try {
  await client.connect();
  await client.query("begin");
  await client.query(sql);
  await client.query("commit");
  console.log(`Applied ${migrationName}.`);
} catch (error) {
  await client.query("rollback").catch(() => undefined);
  console.error(error instanceof Error ? error.message : "Migration failed.");
  process.exitCode = 1;
} finally {
  await client.end().catch(() => undefined);
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
