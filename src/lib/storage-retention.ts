export const auditedStorageBuckets = [
  "listing-covers",
  "profile-media",
  "audio-previews",
  "license-deliverables",
  "collab-files"
] as const;

export type AuditedStorageBucket = (typeof auditedStorageBuckets)[number];

export type StorageObjectInfo = {
  bucket: string;
  name: string;
  sizeBytes: number;
  createdAtMs: number;
  updatedAtMs: number;
};

export type StorageReference = {
  bucket: AuditedStorageBucket;
  name: string;
  reason: string;
};

export type StorageAuditOptions = {
  nowMs: number;
  orphanGraceDays: number;
};

export function planStorageRetentionAudit(
  objects: StorageObjectInfo[],
  references: StorageReference[],
  options: StorageAuditOptions
) {
  const protectedKeys = new Map(
    references.map((reference) => [storageKey(reference.bucket, reference.name), reference.reason])
  );
  const auditedBuckets = new Set<string>(auditedStorageBuckets);
  const cutoffMs = options.nowMs - options.orphanGraceDays * 24 * 60 * 60 * 1000;

  const inspected = objects.filter((object) => auditedBuckets.has(object.bucket));
  const ignored = objects.filter((object) => !auditedBuckets.has(object.bucket));
  const protectedObjects = inspected.filter((object) => protectedKeys.has(storageKey(object.bucket, object.name)));
  const orphanObjects = inspected.filter((object) => !protectedKeys.has(storageKey(object.bucket, object.name)));
  const deletionCandidates = orphanObjects.filter((object) => object.createdAtMs < cutoffMs);

  return {
    inspectedObjects: inspected.length,
    ignoredObjects: ignored.length,
    protectedObjects: protectedObjects.length,
    orphanObjects: orphanObjects.length,
    deletionCandidates: deletionCandidates.length,
    protectedBytes: sumBytes(protectedObjects),
    orphanBytes: sumBytes(orphanObjects),
    deletionCandidateBytes: sumBytes(deletionCandidates),
    buckets: auditedStorageBuckets.map((bucket) => bucketSummary(bucket, inspected, protectedKeys, cutoffMs)),
    sampleCandidates: deletionCandidates.slice(0, 12).map((object) => ({
      bucket: object.bucket,
      name: object.name,
      sizeBytes: object.sizeBytes
    })),
    neverDelete: [
      "referenced profile media",
      "referenced listing covers",
      "referenced audio previews",
      "referenced paid license deliverables",
      "referenced collaboration files",
      "unknown buckets"
    ]
  };
}

export function storageKey(bucket: string, name: string) {
  return `${bucket}/${name}`;
}

export function extractStorageReference(
  value: string | null | undefined,
  fallbackBucket?: AuditedStorageBucket
): StorageReference | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const publicMatch = trimmed.match(/\/storage\/v1\/object\/public\/([^/?#]+)\/([^?#]+)/);
  if (publicMatch?.[1] && publicMatch[2] && isAuditedBucket(publicMatch[1])) {
    return {
      bucket: publicMatch[1],
      name: decodeURIComponent(publicMatch[2]),
      reason: "public URL reference"
    };
  }

  if (fallbackBucket) {
    return {
      bucket: fallbackBucket,
      name: trimmed.replace(/^\/+/, ""),
      reason: "database path reference"
    };
  }

  return null;
}

function bucketSummary(
  bucket: AuditedStorageBucket,
  objects: StorageObjectInfo[],
  protectedKeys: Map<string, string>,
  cutoffMs: number
) {
  const bucketObjects = objects.filter((object) => object.bucket === bucket);
  const protectedObjects = bucketObjects.filter((object) => protectedKeys.has(storageKey(object.bucket, object.name)));
  const orphanObjects = bucketObjects.filter((object) => !protectedKeys.has(storageKey(object.bucket, object.name)));
  const deletionCandidates = orphanObjects.filter((object) => object.createdAtMs < cutoffMs);

  return {
    bucket,
    objects: bucketObjects.length,
    protectedObjects: protectedObjects.length,
    orphanObjects: orphanObjects.length,
    deletionCandidates: deletionCandidates.length,
    totalBytes: sumBytes(bucketObjects),
    orphanBytes: sumBytes(orphanObjects),
    deletionCandidateBytes: sumBytes(deletionCandidates)
  };
}

function isAuditedBucket(bucket: string): bucket is AuditedStorageBucket {
  return (auditedStorageBuckets as readonly string[]).includes(bucket);
}

function sumBytes(objects: StorageObjectInfo[]) {
  return objects.reduce((sum, object) => sum + object.sizeBytes, 0);
}
