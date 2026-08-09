import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

const databaseUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error(
    "Missing SUPABASE_DATABASE_URL. Copy the Supabase direct Postgres connection string and run this command again."
  );
  process.exit(1);
}

const schemaPath = resolve(process.cwd(), "supabase/schema.sql");
const schemaSql = readFileSync(schemaPath, "utf8");
const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

try {
  await client.connect();
  await client.query("begin");
  await client.query(schemaSql);
  await client.query("commit");

  const { rows } = await client.query(`
    select
      to_regclass('public.profiles') as profiles,
      to_regclass('public.listings') as listings,
      to_regclass('public.order_requests') as order_requests,
      to_regclass('public.conversations') as conversations,
      to_regclass('public.messages') as messages
  `);

  console.log(JSON.stringify({ ok: true, tables: rows[0] }, null, 2));
} catch (error) {
  await client.query("rollback").catch(() => undefined);
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => undefined);
}
