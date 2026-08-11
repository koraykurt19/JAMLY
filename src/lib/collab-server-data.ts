import "server-only";
import type { Database } from "@/lib/database.types";
import type {
  CollabCommentView,
  CollabInvitation,
  CollabParticipantView,
  CollabProjectDetail,
  CollabProjectSummary,
  CollabRole,
  CollabVersionView
} from "@/lib/collab-types";
import { getSupabaseServerClient } from "@/lib/supabase-server";

type ProfilePreview = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "handle" | "full_name" | "avatar_url"
>;

export async function getCollabDashboard(userId: string) {
  const client = getSupabaseServerClient();
  if (!client) return { projects: [], invitations: [], configured: false };

  const [{ data: projects, error: projectsError }, { data: invitations, error: invitationsError }] =
    await Promise.all([
      client
        .from("collab_projects")
        .select("id,title,description,owner_id,listing_id,status,updated_at")
        .order("updated_at", { ascending: false }),
      client.rpc("get_my_collab_invitations")
    ]);

  if (projectsError) throw new Error(projectsError.message);
  if (invitationsError) throw new Error(invitationsError.message);

  return {
    configured: true,
    projects: (projects ?? []).map(
      (project): CollabProjectSummary => ({
        id: project.id,
        title: project.title,
        description: project.description,
        status: project.status,
        ownerId: project.owner_id,
        listingId: project.listing_id,
        updatedAt: project.updated_at,
        isOwner: project.owner_id === userId
      })
    ),
    invitations: (invitations ?? []).map(
      (invitation): CollabInvitation => ({
        participantId: invitation.participant_id,
        projectId: invitation.project_id,
        title: invitation.project_title,
        description: invitation.project_description,
        ownerHandle: invitation.owner_handle,
        role: invitation.participant_role as CollabRole,
        revenueShare: Number(invitation.revenue_share),
        createdAt: invitation.created_at
      })
    )
  };
}

export async function getOwnedListings(userId: string) {
  const client = getSupabaseServerClient();
  if (!client) return [];
  const { data, error } = await client
    .from("listings")
    .select("id,title,category")
    .eq("creator_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getCollabProject(projectId: string, userId: string) {
  const client = getSupabaseServerClient();
  if (!client) return null;

  const { data: project, error: projectError } = await client
    .from("collab_projects")
    .select("id,title,description,owner_id,listing_id,status,updated_at")
    .eq("id", projectId)
    .maybeSingle();
  if (projectError) throw new Error(projectError.message);
  if (!project) return null;

  const [participantsResult, versionsResult, commentsResult] = await Promise.all([
    client
      .from("collab_participants")
      .select("id,user_id,role,revenue_share,invite_status")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true }),
    client
      .from("collab_versions")
      .select("id,project_id,uploaded_by,file_path,version_note,created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false }),
    client
      .from("collab_comments")
      .select("id,project_id,version_id,user_id,content,timestamp_seconds,parent_comment_id,created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true })
  ]);

  if (participantsResult.error) throw new Error(participantsResult.error.message);
  if (versionsResult.error) throw new Error(versionsResult.error.message);
  if (commentsResult.error) throw new Error(commentsResult.error.message);

  const profileIds = Array.from(
    new Set([
      project.owner_id,
      ...(participantsResult.data ?? []).map((row) => row.user_id),
      ...(versionsResult.data ?? []).map((row) => row.uploaded_by),
      ...(commentsResult.data ?? []).map((row) => row.user_id)
    ])
  );
  const { data: profiles, error: profilesError } = await client
    .from("profiles")
    .select("id,handle,full_name,avatar_url")
    .in("id", profileIds);
  if (profilesError) throw new Error(profilesError.message);
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile as ProfilePreview]));

  const filePaths = (versionsResult.data ?? []).map((version) => version.file_path);
  const signedUrlMap = new Map<string, string | null>();
  if (filePaths.length > 0) {
    const { data: signedFiles } = await client.storage
      .from("collab-files")
      .createSignedUrls(filePaths, 60 * 60);
    signedFiles?.forEach((file, index) => {
      signedUrlMap.set(filePaths[index] ?? "", file.signedUrl ?? null);
    });
  }

  let listingTitle: string | null = null;
  if (project.listing_id) {
    const { data: listing } = await client
      .from("listings")
      .select("title")
      .eq("id", project.listing_id)
      .maybeSingle();
    listingTitle = listing?.title ?? null;
  }

  const ownerProfile = profileMap.get(project.owner_id);
  const participants: CollabParticipantView[] = (participantsResult.data ?? []).map((row) => {
    const profile = profileMap.get(row.user_id);
    return {
      id: row.id,
      userId: row.user_id,
      handle: profile?.handle ?? row.user_id.slice(0, 8),
      fullName: profile?.full_name ?? "Jamly üyesi",
      avatarUrl: profile?.avatar_url ?? null,
      role: row.role as CollabRole,
      revenueShare: Number(row.revenue_share),
      inviteStatus: row.invite_status
    };
  });

  const versions: CollabVersionView[] = (versionsResult.data ?? []).map((row) => ({
    id: row.id,
    projectId: row.project_id,
    uploadedBy: row.uploaded_by,
    uploaderHandle: profileMap.get(row.uploaded_by)?.handle ?? row.uploaded_by.slice(0, 8),
    filePath: row.file_path,
    fileName: row.file_path.split("/").pop() ?? "collab-file",
    signedUrl: signedUrlMap.get(row.file_path) ?? null,
    versionNote: row.version_note,
    createdAt: row.created_at
  }));

  const comments: CollabCommentView[] = (commentsResult.data ?? []).map((row) => ({
    id: row.id,
    projectId: row.project_id,
    versionId: row.version_id,
    userId: row.user_id,
    authorHandle: profileMap.get(row.user_id)?.handle ?? row.user_id.slice(0, 8),
    content: row.content,
    timestampSeconds: row.timestamp_seconds === null ? null : Number(row.timestamp_seconds),
    parentCommentId: row.parent_comment_id,
    createdAt: row.created_at
  }));

  const detail: CollabProjectDetail = {
    id: project.id,
    title: project.title,
    description: project.description,
    status: project.status,
    ownerId: project.owner_id,
    listingId: project.listing_id,
    updatedAt: project.updated_at,
    isOwner: project.owner_id === userId,
    ownerHandle: ownerProfile?.handle ?? project.owner_id.slice(0, 8),
    ownerName: ownerProfile?.full_name ?? "Jamly üyesi",
    ownerAvatarUrl: ownerProfile?.avatar_url ?? null,
    listingTitle,
    participants,
    versions,
    comments
  };
  return detail;
}
