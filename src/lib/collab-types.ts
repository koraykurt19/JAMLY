export type CollabProjectStatus = "draft" | "active" | "completed";
export type CollabRole = "producer" | "composer" | "mixing" | "mastering" | "other";
export type CollabInviteStatus = "pending" | "accepted" | "declined";

export type CollabProjectSummary = {
  id: string;
  title: string;
  description: string | null;
  status: CollabProjectStatus;
  ownerId: string;
  listingId: string | null;
  updatedAt: string;
  isOwner: boolean;
};

export type CollabInvitation = {
  participantId: string;
  projectId: string;
  title: string;
  description: string | null;
  ownerHandle: string | null;
  role: CollabRole;
  revenueShare: number;
  createdAt: string;
};

export type CollabParticipantView = {
  id: string;
  userId: string;
  handle: string;
  fullName: string;
  avatarUrl: string | null;
  role: CollabRole;
  revenueShare: number;
  inviteStatus: CollabInviteStatus;
};

export type CollabVersionView = {
  id: string;
  projectId: string;
  uploadedBy: string;
  uploaderHandle: string;
  filePath: string;
  fileName: string;
  signedUrl: string | null;
  versionNote: string | null;
  createdAt: string;
};

export type CollabCommentView = {
  id: string;
  projectId: string;
  versionId: string;
  userId: string;
  authorHandle: string;
  content: string;
  timestampSeconds: number | null;
  parentCommentId: string | null;
  createdAt: string;
};

export type CollabProjectDetail = CollabProjectSummary & {
  ownerHandle: string;
  ownerName: string;
  ownerAvatarUrl: string | null;
  listingTitle: string | null;
  participants: CollabParticipantView[];
  versions: CollabVersionView[];
  comments: CollabCommentView[];
};

export type CollabActionResult = {
  ok: boolean;
  message: string;
  id?: string;
};
