export type ArtifactFile = {
  path: string;
  sizeBytes: number;
  modifiedAtMs: number;
};

export type ArtifactRetentionOptions = {
  nowMs: number;
  keepDays: number;
  maxBytes: number;
};

export function planArtifactPrune(files: ArtifactFile[], options: ArtifactRetentionOptions) {
  const cutoffMs = options.nowMs - options.keepDays * 24 * 60 * 60 * 1000;
  const sorted = [...files].sort((a, b) => b.modifiedAtMs - a.modifiedAtMs);
  const keep = new Set<string>();
  const remove = new Set<string>();
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
