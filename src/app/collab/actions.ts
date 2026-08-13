"use server";

import { revalidatePath } from "next/cache";
import type {
  CollabActionResult,
  CollabInviteStatus,
  CollabProjectStatus,
  CollabRole
} from "@/lib/collab-types";
import { getSupabaseServerClient } from "@/lib/supabase-server";

const roles: CollabRole[] = ["producer", "composer", "mixing", "mastering", "other"];

async function getContext() {
  const client = await getSupabaseServerClient();
  if (!client) return { client: null, user: null };
  const {
    data: { user }
  } = await client.auth.getUser();
  return { client, user };
}

export async function createCollabProjectAction(input: {
  title: string;
  description?: string;
  listingId?: string;
}): Promise<CollabActionResult> {
  const { client, user } = await getContext();
  if (!client || !user) return unauthorized();
  const title = input.title.trim();
  if (title.length < 2 || title.length > 120) {
    return fail("Proje başlığı 2-120 karakter olmalı.");
  }

  const { data, error } = await client
    .from("collab_projects")
    .insert({
      title,
      description: cleanOptional(input.description, 5000),
      listing_id: cleanOptional(input.listingId, 64),
      owner_id: user.id,
      status: "active"
    })
    .select("id")
    .single();
  if (error) return fail(error.message);
  revalidatePath("/collab");
  return { ok: true, message: "Proje oluşturuldu.", id: data.id };
}

export async function sendCollabInviteAction(input: {
  projectId: string;
  handle: string;
  role: CollabRole;
  revenueShare: number;
}): Promise<CollabActionResult> {
  const { client, user } = await getContext();
  if (!client || !user) return unauthorized();
  if (!roles.includes(input.role)) return fail("Geçersiz proje rolü.");
  if (!isShareValid(input.revenueShare)) return fail("Gelir payı 0-100 arasında olmalı.");

  const normalizedHandle = input.handle.trim().toLowerCase().replace(/^@/, "");
  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("id")
    .eq("handle", normalizedHandle)
    .maybeSingle();
  if (profileError) return fail(profileError.message);
  if (!profile) return fail("Bu kullanıcı adına ait profil bulunamadı.");
  if (profile.id === user.id) return fail("Kendinize davet gönderemezsiniz.");

  const { error } = await client.from("collab_participants").insert({
    project_id: input.projectId,
    user_id: profile.id,
    role: input.role,
    revenue_share: input.revenueShare,
    invite_status: "pending"
  });
  if (error) return fail(error.message);
  revalidateProject(input.projectId);
  return { ok: true, message: `@${normalizedHandle} davet edildi.` };
}

export async function updateInviteStatusAction(input: {
  participantId: string;
  projectId: string;
  status: Extract<CollabInviteStatus, "accepted" | "declined">;
}): Promise<CollabActionResult> {
  const { client, user } = await getContext();
  if (!client || !user) return unauthorized();
  if (!(["accepted", "declined"] as const).includes(input.status)) {
    return fail("Geçersiz davet durumu.");
  }
  const { error } = await client
    .from("collab_participants")
    .update({ invite_status: input.status })
    .eq("id", input.participantId)
    .eq("user_id", user.id);
  if (error) return fail(error.message);
  revalidateProject(input.projectId);
  return { ok: true, message: input.status === "accepted" ? "Davet kabul edildi." : "Davet reddedildi." };
}

export async function updateRevenueShareAction(input: {
  participantId: string;
  projectId: string;
  revenueShare: number;
}): Promise<CollabActionResult> {
  const { client, user } = await getContext();
  if (!client || !user) return unauthorized();
  if (!isShareValid(input.revenueShare)) return fail("Gelir payı 0-100 arasında olmalı.");
  const { error } = await client
    .from("collab_participants")
    .update({ revenue_share: input.revenueShare })
    .eq("id", input.participantId)
    .eq("project_id", input.projectId);
  if (error) return fail(error.message);
  revalidateProject(input.projectId);
  return { ok: true, message: "Gelir payı güncellendi." };
}

export async function addCollabVersionAction(input: {
  projectId: string;
  filePath: string;
  versionNote?: string;
}): Promise<CollabActionResult> {
  const { client, user } = await getContext();
  if (!client || !user) return unauthorized();
  if (!input.filePath.startsWith(`${input.projectId}/${user.id}/`)) {
    return fail("Geçersiz dosya yolu.");
  }
  const { data, error } = await client
    .from("collab_versions")
    .insert({
      project_id: input.projectId,
      uploaded_by: user.id,
      file_path: input.filePath,
      version_note: cleanOptional(input.versionNote, 2000)
    })
    .select("id")
    .single();
  if (error) return fail(error.message);
  revalidateProject(input.projectId);
  return { ok: true, message: "Yeni versiyon kaydedildi.", id: data.id };
}

export async function addCollabCommentAction(input: {
  projectId: string;
  versionId: string;
  content: string;
  timestampSeconds?: number;
  parentCommentId?: string;
}): Promise<CollabActionResult> {
  const { client, user } = await getContext();
  if (!client || !user) return unauthorized();
  const content = input.content.trim();
  if (content.length < 1 || content.length > 4000) return fail("Yorum 1-4000 karakter olmalı.");
  const timestamp = input.timestampSeconds;
  if (timestamp !== undefined && (!Number.isFinite(timestamp) || timestamp < 0)) {
    return fail("Geçersiz zaman kodu.");
  }
  const { data, error } = await client
    .from("collab_comments")
    .insert({
      project_id: input.projectId,
      version_id: input.versionId,
      user_id: user.id,
      content,
      timestamp_seconds: timestamp ?? null,
      parent_comment_id: cleanOptional(input.parentCommentId, 64)
    })
    .select("id")
    .single();
  if (error) return fail(error.message);
  revalidateProject(input.projectId);
  return { ok: true, message: "Yorum eklendi.", id: data.id };
}

export async function updateCollabProjectStatusAction(input: {
  projectId: string;
  status: CollabProjectStatus;
}): Promise<CollabActionResult> {
  const { client, user } = await getContext();
  if (!client || !user) return unauthorized();
  if (!(["draft", "active", "completed"] as const).includes(input.status)) {
    return fail("Geçersiz proje durumu.");
  }
  const { error } = await client
    .from("collab_projects")
    .update({ status: input.status })
    .eq("id", input.projectId)
    .eq("owner_id", user.id);
  if (error) return fail(error.message);
  revalidateProject(input.projectId);
  return { ok: true, message: "Proje durumu güncellendi." };
}

function revalidateProject(projectId: string) {
  revalidatePath("/collab");
  revalidatePath(`/collab/${projectId}`);
}

function cleanOptional(value: string | undefined, maxLength: number) {
  const cleaned = value?.trim().slice(0, maxLength);
  return cleaned || null;
}

function isShareValid(value: number) {
  return Number.isFinite(value) && value >= 0 && value <= 100;
}

function unauthorized(): CollabActionResult {
  return fail("Bu işlem için giriş yapmalısınız.");
}

function fail(message: string): CollabActionResult {
  return { ok: false, message };
}
