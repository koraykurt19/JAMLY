import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";
import {
  extractStorageReference,
  planStorageRetentionAudit
} from "../src/lib/storage-retention.ts";

loadEnv(resolve(process.cwd(), ".env.local"));
loadEnv(resolve(process.cwd(), ".env.production.local"));

const databaseUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
const logDir = resolve(process.cwd(), "work", "storage-retention-runs");
const orphanGraceDays = Number(process.env.STORAGE_ORPHAN_GRACE_DAYS ?? 2);

if (!databaseUrl) {
  console.error("Missing SUPABASE_DATABASE_URL or DATABASE_URL. Storage audit was not run.");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }
});

try {
  await client.connect();
  const [objects, references] = await Promise.all([listStorageObjects(), collectReferences()]);
  const plan = planStorageRetentionAudit(objects, references, {
    nowMs: Date.now(),
    orphanGraceDays
  });

  const report = {
    checkedAt: new Date().toISOString(),
    mode: "dry_run",
    orphanGraceDays,
    ...plan
  };

  mkdirSync(logDir, { recursive: true });
  writeFileSync(
    resolve(logDir, `${report.checkedAt.replace(/[:.]/g, "-")}-dry-run.json`),
    JSON.stringify({ ...report, references: references.length }, null, 2)
  );

  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : "Storage retention audit failed.");
  process.exitCode = 1;
} finally {
  await client.end().catch(() => undefined);
}

async function listStorageObjects() {
  const { rows } = await client.query(`
    select
      bucket_id,
      name,
      coalesce((metadata->>'size')::bigint, 0) as size_bytes,
      created_at,
      updated_at
    from storage.objects
    where bucket_id in (
      'listing-covers',
      'profile-media',
      'audio-previews',
      'license-deliverables',
      'collab-files'
    )
    order by created_at asc
  `);

  return rows.map((row) => ({
    bucket: row.bucket_id,
    name: row.name,
    sizeBytes: Number(row.size_bytes ?? 0),
    createdAtMs: new Date(row.created_at).getTime(),
    updatedAtMs: new Date(row.updated_at ?? row.created_at).getTime()
  }));
}

async function collectReferences() {
  const references = [];

  const { rows: profiles } = await client.query(`
    select avatar_url, cover_url
    from public.profiles
    where avatar_url is not null or cover_url is not null
  `);
  for (const profile of profiles) {
    pushReference(references, extractStorageReference(profile.avatar_url));
    pushReference(references, extractStorageReference(profile.cover_url));
  }

  const { rows: listings } = await client.query(`
    select
      audio_preview_url,
      cover_image_url,
      delivery_mp3_path,
      delivery_unlimited_path,
      delivery_exclusive_path
    from public.listings
  `);
  for (const listing of listings) {
    pushReference(references, extractStorageReference(listing.audio_preview_url));
    pushReference(references, extractStorageReference(listing.cover_image_url));
    pushReference(references, extractStorageReference(listing.delivery_mp3_path, "license-deliverables"));
    pushReference(references, extractStorageReference(listing.delivery_unlimited_path, "license-deliverables"));
    pushReference(references, extractStorageReference(listing.delivery_exclusive_path, "license-deliverables"));
  }

  const { rows: orders } = await client.query(`
    select delivery_path_snapshot
    from public.order_requests
    where delivery_path_snapshot is not null
  `);
  for (const order of orders) {
    pushReference(references, extractStorageReference(order.delivery_path_snapshot, "license-deliverables"));
  }

  const { rows: versions } = await client.query(`
    select file_path
    from public.collab_versions
    where file_path is not null
  `);
  for (const version of versions) {
    pushReference(references, extractStorageReference(version.file_path, "collab-files"));
  }

  return dedupeReferences(references);
}

function pushReference(references, reference) {
  if (reference) references.push(reference);
}

function dedupeReferences(references) {
  const seen = new Set();
  return references.filter((reference) => {
    const key = `${reference.bucket}/${reference.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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
