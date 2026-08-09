import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

const migrationName = process.argv[2];
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
if (!migrationPath.startsWith(`${migrationsDirectory}/`) || !existsSync(migrationPath)) {
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
