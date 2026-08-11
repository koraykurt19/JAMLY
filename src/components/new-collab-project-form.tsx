"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { type FormEvent, startTransition, useState } from "react";
import { createCollabProjectAction } from "@/app/collab/actions";

type ListingOption = { id: string; title: string; category: string };

export function NewCollabProjectForm({ listings }: { listings: ListingOption[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [listingId, setListingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setFeedback("");
    startTransition(async () => {
      const result = await createCollabProjectAction({ title, description, listingId });
      setLoading(false);
      setFeedback(result.message);
      if (result.ok && result.id) router.push(`/collab/${result.id}`);
    });
  }

  return (
    <form onSubmit={submit} className="mt-9 space-y-6 border border-white/10 bg-[#10151f] p-5 sm:p-7">
      <label className="block space-y-2">
        <span className="text-sm font-semibold text-white/72">Proje adı</span>
        <input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={120} placeholder="Örn. Gece Yolculuğu EP" className="focus-ring h-12 w-full rounded-md border border-white/10 bg-black/25 px-4 text-white placeholder:text-white/25" />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-semibold text-white/72">Proje özeti</span>
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={5000} rows={5} placeholder="Hedefi, referansları ve teslim beklentisini yazın." className="focus-ring w-full resize-y rounded-md border border-white/10 bg-black/25 px-4 py-3 text-white placeholder:text-white/25" />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-semibold text-white/72">Bağlı ilan <span className="font-normal text-white/35">(opsiyonel)</span></span>
        <select value={listingId} onChange={(event) => setListingId(event.target.value)} className="focus-ring h-12 w-full rounded-md border border-white/10 bg-[#0b0f16] px-4 text-white">
          <option value="">İlan bağlama</option>
          {listings.map((listing) => <option key={listing.id} value={listing.id}>{listing.title} · {listing.category}</option>)}
        </select>
        <span className="block text-xs leading-5 text-white/36">Tamamlanan projelerde gelir dağılımı, bağlı ilanın teslim edilen siparişlerine uygulanır.</span>
      </label>
      {feedback ? <p className={`border px-4 py-3 text-sm ${feedback.includes("oluşturuldu") ? "border-emerald-400/20 bg-emerald-400/8 text-emerald-200" : "border-red-400/20 bg-red-400/8 text-red-200"}`}>{feedback}</p> : null}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Link href="/collab" className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-white/10 px-4 text-sm font-semibold text-white/60 hover:text-white"><ArrowLeft size={16} /> Projelere dön</Link>
        <button type="submit" disabled={loading} className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-jam-mint px-6 text-sm font-bold text-black disabled:opacity-50">{loading ? <Loader2 size={17} className="animate-spin" /> : null} Projeyi oluştur</button>
      </div>
    </form>
  );
}
