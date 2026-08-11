"use client";

import { FileAudio, Loader2, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { addCollabVersionAction } from "@/app/collab/actions";
import { getSupabaseBrowserClient } from "@/lib/supabase";

const MAX_FILE_BYTES = 50 * 1024 * 1024;
const allowedExtensions = ["mp3", "wav", "m4a", "aiff", "aif", "flac", "zip"];

export function FileUploader({ projectId, userId }: { projectId: string; userId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function upload() {
    if (!file || busy) return;
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!allowedExtensions.includes(extension)) {
      setFeedback({ type: "error", text: "MP3, WAV, M4A, AIFF, FLAC veya ZIP yükleyin." });
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setFeedback({ type: "error", text: "Dosya en fazla 50 MB olabilir." });
      return;
    }

    const client = getSupabaseBrowserClient();
    if (!client) {
      setFeedback({ type: "error", text: "Supabase bağlantısı yapılandırılmamış." });
      return;
    }

    setBusy(true);
    setFeedback(null);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
    const filePath = `${projectId}/${userId}/${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await client.storage.from("collab-files").upload(filePath, file, {
      cacheControl: "3600",
      contentType: file.type || undefined,
      upsert: false
    });

    if (uploadError) {
      setBusy(false);
      setFeedback({ type: "error", text: `Dosya yüklenemedi: ${uploadError.message}` });
      return;
    }

    const result = await addCollabVersionAction({ projectId, filePath, versionNote: note });
    if (!result.ok) {
      await client.storage.from("collab-files").remove([filePath]);
      setBusy(false);
      setFeedback({ type: "error", text: result.message });
      return;
    }

    setFile(null);
    setNote("");
    if (inputRef.current) inputRef.current.value = "";
    setBusy(false);
    setFeedback({ type: "success", text: result.message });
    router.refresh();
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="rounded-lg border border-dashed border-white/14 bg-white/[0.025] p-5 sm:p-7">
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept="audio/*,.zip,.wav,.mp3,.m4a,.aiff,.aif,.flac"
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            setFeedback(null);
          }}
          id="collab-file"
        />
        <label
          htmlFor="collab-file"
          className="focus-ring flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-md border border-white/[0.07] bg-[#0d1118] px-5 text-center transition hover:border-jam-blue/45 hover:bg-jam-blue/[0.06]"
        >
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-jam-blue/12 text-jam-blue">
            {file ? <FileAudio size={23} /> : <UploadCloud size={23} />}
          </span>
          <strong className="text-base text-white">{file ? file.name : "Ses dosyası veya paket seç"}</strong>
          <span className="mt-2 text-sm text-white/48">MP3, WAV, M4A, AIFF, FLAC veya ZIP · en fazla 50 MB</span>
        </label>
      </div>

      <div className="rounded-lg border border-white/[0.09] bg-[#0d1118] p-5">
        <label htmlFor="version-note" className="text-xs font-bold uppercase tracking-[0.16em] text-white/44">
          Versiyon notu
        </label>
        <textarea
          id="version-note"
          value={note}
          onChange={(event) => setNote(event.target.value.slice(0, 2000))}
          placeholder="Nelerin değiştiğini ekibe anlatın."
          className="focus-ring mt-3 min-h-32 w-full resize-y rounded-md border border-white/10 bg-black/25 p-3 text-sm text-white placeholder:text-white/30"
        />
        <button
          type="button"
          onClick={() => void upload()}
          disabled={!file || busy}
          className="focus-ring mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-jam-mint px-4 text-sm font-bold text-[#071018] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
        >
          {busy ? <Loader2 size={17} className="animate-spin" /> : <UploadCloud size={17} />}
          {busy ? "Yükleniyor..." : "Yeni versiyonu yükle"}
        </button>
        {feedback ? (
          <p className={`mt-3 text-sm ${feedback.type === "error" ? "text-red-300" : "text-emerald-300"}`} role="status">
            {feedback.text}
          </p>
        ) : null}
      </div>
    </div>
  );
}
