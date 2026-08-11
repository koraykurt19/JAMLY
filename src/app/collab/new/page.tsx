import { redirect } from "next/navigation";
import { NewCollabProjectForm } from "@/components/new-collab-project-form";
import { getOwnedListings } from "@/lib/collab-server-data";
import { requireServerUser } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function NewCollabProjectPage() {
  const auth = await requireServerUser("/collab/new");
  if (auth.redirectTo) redirect(auth.redirectTo);
  if (!auth.client || !auth.user) redirect("/collab");

  const listings = await getOwnedListings(auth.user.id);
  return (
    <section className="mx-auto min-h-[72vh] w-full max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-jam-blue">Yeni çalışma alanı</p>
      <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Bir müzik projesi başlatın</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
        Projeyi daha sonra katılımcılar, versiyonlar ve zaman kodlu yorumlarla geliştirebilirsiniz.
      </p>
      <NewCollabProjectForm listings={listings} />
    </section>
  );
}
