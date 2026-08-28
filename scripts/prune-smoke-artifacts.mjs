import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";

const execute = process.argv.includes("--execute");
const confirmIndex = process.argv.indexOf("--confirm");
const confirm = confirmIndex >= 0 ? process.argv[confirmIndex + 1] : "";
const keepDays = readPositiveNumber(process.env.SMOKE_ARTIFACT_KEEP_DAYS, 7);
const maxMb = readPositiveNumber(process.env.SMOKE_ARTIFACT_MAX_MB, 256);
const roots = [
  resolve(process.cwd(), "work", "live-smoke"),
  resolve(process.cwd(), "work", "retention-runs"),
  resolve(process.cwd(), "work", "storage-retention-runs")
];
const reportDir = resolve(process.cwd(), "work", "artifact-prune-runs");

if (execute && confirm !== "PRUNE_SMOKE_ARTIFACTS") {
  console.error("Execute mode requires: --execute --confirm PRUNE_SMOKE_ARTIFACTS");
  process.exit(1);
}

const files = roots.flatMap((root) => listFiles(root));
const plan = planArtifactPrune(files, {
  nowMs: Date.now(),
  keepDays,
  maxBytes: maxMb * 1024 * 1024
});

if (execute) {
  for (const file of plan.deleteFiles) {
    assertInsideRoots(file.path);
    unlinkSync(file.path);
  }
}

mkdirSync(reportDir, { recursive: true });
const checkedAt = new Date().toISOString();
const report = {
  checkedAt,
  mode: execute ? "execute" : "dry_run",
  keepDays,
  maxMb,
  scannedFiles: files.length,
  deletedFiles: plan.deleteFiles.length,
  deletedBytes: plan.deletedBytes,
  keptFiles: plan.keepFiles.length,
  keptBytes: plan.keptBytes,
  roots: roots.map((root) => relative(process.cwd(), root)),
  sampleDeleted: plan.deleteFiles.slice(0, 20).map((file) => ({
    path: relative(process.cwd(), file.path),
    sizeBytes: file.sizeBytes,
    modifiedAt: new Date(file.modifiedAtMs).toISOString()
  }))
};
writeFileSync(
  join(reportDir, `${checkedAt.replace(/[:.]/g, "-")}-${report.mode}.json`),
  JSON.stringify(report, null, 2)
);

console.log(JSON.stringify(report, null, 2));

function listFiles(root) {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(root, entry.name);
    if (entry.isDirectory()) return listFiles(path);
    if (!entry.isFile()) return [];
    const stats = statSync(path);
    return [{ path, sizeBytes: stats.size, modifiedAtMs: stats.mtimeMs }];
  });
}

function planArtifactPrune(files, options) {
  const cutoffMs = options.nowMs - options.keepDays * 24 * 60 * 60 * 1000;
  const sorted = [...files].sort((a, b) => b.modifiedAtMs - a.modifiedAtMs);
  const keep = new Set();
  const remove = new Set();
  let keptBytes = 0;

  for (const file of sorted) {
    const expired = file.modifiedAtMs < cutoffMs;
    const overBudget = keptBytes + file.sizeBytes > options.maxBytes;

    if (expired || overBudget) {
      remove.add(file.path);
    } else {
      keep.add(file.path);
      keptBytes += file.sizeBytes;
    }
  }

  const deleteFiles = sorted.filter((file) => remove.has(file.path));
  const keepFiles = sorted.filter((file) => keep.has(file.path));

  return {
    keepFiles,
    deleteFiles,
    keptBytes,
    deletedBytes: deleteFiles.reduce((sum, file) => sum + file.sizeBytes, 0),
    cutoffMs
  };
}

function assertInsideRoots(path) {
  const target = resolve(path);
  const inside = roots.some((root) => {
    const rel = relative(root, target);
    return rel && !rel.startsWith("..") && !isAbsolute(rel);
  });
  if (!inside) throw new Error(`Refusing to delete outside smoke artifact roots: ${path}`);
}

function readPositiveNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
