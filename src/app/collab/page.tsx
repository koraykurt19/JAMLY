import { redirect } from "next/navigation";
import { FolderKanban, Plus } from "lucide-react";
import Link from "next/link";
import { CollabProjectTabs } from "@/components/collab-project-tabs";
import { getCollabDashboard } from "@/lib/collab-server-data";
import { requireServerUser } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function CollabPage() {
  const auth = await requireServerUser("/collab");
  if (auth.redirectTo) redirect(auth.redirectTo);

  if (!auth.client || !auth.user) {
    return <CollabUnavailable />;
  }

  const data = await getCollabDashboard(auth.user.id);
  return (
    <section className="mx-auto min-h-[72vh] w-full max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="flex flex-col gap-6 border-b border-white/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-jam-blue">
            <FolderKanban size={18} />
            <p className="text-xs font-bold uppercase tracking-[0.22em]">Collab workspace</p>
          </div>
          <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Ortak projeler</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
            Davetleri, gelir paylarını, dosya versiyonlarını ve zaman kodlu geri bildirimleri tek çalışma alanında yönetin.
          </p>
        </div>
        <Link
          href="/collab/new"
          className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-jam-mint px-5 text-sm font-bold text-[#071018] transition hover:bg-white"
        >
          <Plus size={17} />
          Yeni proje
        </Link>
      </div>

      <CollabProjectTabs projects={data.projects} invitations={data.invitations} />
    </section>
  );
}

function CollabUnavailable() {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-xl items-center px-4 text-center">
      <div className="w-full border border-white/10 bg-white/[0.025] p-8">
        <h1 className="text-2xl font-semibold text-white">Collab şu anda kullanılamıyor</h1>
        <p className="mt-3 text-sm leading-6 text-white/50">
          Supabase bağlantısı yapılandırıldığında ortak çalışma alanı burada açılır.
        </p>
      </div>
    </section>
  );
}
