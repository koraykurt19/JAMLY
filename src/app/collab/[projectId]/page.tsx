import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CollabWorkspace } from "@/components/collab-workspace";
import { getCollabProject } from "@/lib/collab-server-data";
import { requireServerUser } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function CollabProjectPage({
  params
}: {
  params: { projectId: string };
}) {
  const auth = await requireServerUser(`/collab/${params.projectId}`);
  if (!auth.user) redirect(auth.redirectTo ?? "/auth/sign-in");
  const userId = auth.user.id;

  const project = await getCollabProject(params.projectId, userId);
  if (!project) notFound();

  return (
    <div className="min-h-[calc(100vh-72px)] bg-[#080a0f]">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
        <Link
          href="/collab"
          className="focus-ring mb-7 inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-semibold text-white/58 transition hover:text-white"
        >
          <ArrowLeft size={17} />
          Collab projelerine dön
        </Link>
        <CollabWorkspace project={project} currentUserId={userId} />
      </div>
    </div>
  );
}
