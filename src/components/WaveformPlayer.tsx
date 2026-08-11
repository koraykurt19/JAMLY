"use client";

import { Loader2, MessageSquarePlus, Pause, Play, Send } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type WaveSurfer from "wavesurfer.js";
import { addCollabCommentAction } from "@/app/collab/actions";
import type { CollabCommentView } from "@/lib/collab-types";
import type { Database } from "@/lib/database.types";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export function WaveformPlayer({
  projectId,
  versionId,
  url,
  initialComments,
  currentUserId,
  authorHandles
}: {
  projectId: string;
  versionId: string;
  url: string | null;
  initialComments: CollabCommentView[];
  currentUserId: string;
  authorHandles: Record<string, string>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const waveRef = useRef<WaveSurfer | null>(null);
  const [comments, setComments] = useState(initialComments);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setComments(initialComments), [initialComments]);

  useEffect(() => {
    if (!url || !containerRef.current) return;
    let disposed = false;
    let instance: WaveSurfer | null = null;

    void import("wavesurfer.js").then(({ default: WaveSurferModule }) => {
      if (disposed || !containerRef.current) return;
      instance = WaveSurferModule.create({
        container: containerRef.current,
        url,
        height: 92,
        waveColor: "#39445a",
        progressColor: "#76b4ff",
        cursorColor: "#f7f9fc",
        barWidth: 2,
        barGap: 2,
        barRadius: 2,
        normalize: true
      });
      waveRef.current = instance;
      instance.on("ready", () => {
        setReady(true);
        setDuration(instance?.getDuration() ?? 0);
      });
      instance.on("play", () => setPlaying(true));
      instance.on("pause", () => setPlaying(false));
      instance.on("timeupdate", (time) => setCurrentTime(time));
      instance.on("interaction", (time) => {
        setSelectedTime(time);
        setCurrentTime(time);
      });
      instance.on("error", () => setError("Ses önizlemesi yüklenemedi."));
    });

    return () => {
      disposed = true;
      instance?.destroy();
      waveRef.current = null;
    };
  }, [url]);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) return;
    const channel = client
      .channel(`collab_comments:project_id=eq.${projectId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "collab_comments", filter: `project_id=eq.${projectId}` },
        (payload) => {
          const row = payload.new as Database["public"]["Tables"]["collab_comments"]["Row"];
          if (row.version_id !== versionId) return;
          setComments((current) => {
            if (current.some((item) => item.id === row.id)) return current;
            return [...current, {
              id: row.id,
              projectId: row.project_id,
              versionId: row.version_id,
              userId: row.user_id,
              authorHandle: authorHandles[row.user_id] ?? row.user_id.slice(0, 8),
              content: row.content,
              timestampSeconds: row.timestamp_seconds === null ? null : Number(row.timestamp_seconds),
              parentCommentId: row.parent_comment_id,
              createdAt: row.created_at
            }];
          });
        }
      )
      .subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  }, [authorHandles, projectId, versionId]);

  const orderedComments = useMemo(
    () => [...comments].sort((a, b) => (a.timestampSeconds ?? Number.MAX_SAFE_INTEGER) - (b.timestampSeconds ?? Number.MAX_SAFE_INTEGER)),
    [comments]
  );

  async function submitComment() {
    const content = comment.trim();
    if (!content || sending) return;
    setSending(true);
    const result = await addCollabCommentAction({
      projectId,
      versionId,
      content,
      timestampSeconds: selectedTime ?? currentTime
    });
    setSending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setComment("");
    setSelectedTime(null);
  }

  function seek(time: number) {
    waveRef.current?.setTime(time);
    setCurrentTime(time);
    setSelectedTime(time);
  }

  if (!url) {
    return <div className="rounded-lg border border-white/[0.09] bg-white/[0.025] p-6 text-sm text-white/48">Bu dosya için geçerli bir dinleme bağlantısı oluşturulamadı.</div>;
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-white/[0.09] bg-[#0d1118] p-4 sm:p-5">
        <div className="flex items-center gap-4">
          <button
            type="button"
            disabled={!ready}
            onClick={() => void waveRef.current?.playPause()}
            className="focus-ring flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-jam-mint text-[#071018] disabled:opacity-40"
            aria-label={playing ? "Duraklat" : "Oynat"}
          >
            {!ready ? <Loader2 size={20} className="animate-spin" /> : playing ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <div className="min-w-0 flex-1">
            <div ref={containerRef} className="min-h-[92px] w-full cursor-crosshair" aria-label="Yorum eklemek için ses dalgasında bir zamana tıklayın" />
            <div className="mt-2 flex justify-between text-xs tabular-nums text-white/42">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-start gap-3 rounded-md border border-jam-blue/20 bg-jam-blue/[0.06] p-3">
          <MessageSquarePlus size={18} className="mt-0.5 shrink-0 text-jam-blue" />
          <p className="text-sm text-white/58">Ses dalgasında bir noktaya tıklayın; yorum o zaman koduna bağlanır.</p>
        </div>
      </div>

      <div className="rounded-lg border border-white/[0.09] bg-[#0d1118] p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-bold text-white">Zaman kodlu yorum</h3>
          <span className="rounded-md bg-jam-blue/12 px-2.5 py-1 text-xs font-bold text-jam-blue">{formatTime(selectedTime ?? currentTime)}</span>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value.slice(0, 4000))}
            placeholder="Bu noktada ne değişmeli?"
            className="focus-ring min-h-24 flex-1 resize-y rounded-md border border-white/10 bg-black/25 p-3 text-sm text-white placeholder:text-white/30"
          />
          <button
            type="button"
            onClick={() => void submitComment()}
            disabled={!comment.trim() || sending}
            className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-white px-5 text-sm font-bold text-black transition hover:bg-jam-mint disabled:opacity-40 sm:self-end"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Gönder
          </button>
        </div>
        {error ? <p className="mt-3 text-sm text-red-300" role="alert">{error}</p> : null}
      </div>

      <div className="space-y-2">
        {orderedComments.length ? orderedComments.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => seek(item.timestampSeconds ?? 0)}
            className="focus-ring flex w-full items-start gap-3 rounded-md border border-white/[0.08] bg-white/[0.025] p-3 text-left transition hover:border-jam-blue/35 hover:bg-jam-blue/[0.05]"
          >
            <span className="mt-0.5 rounded-md bg-white/[0.06] px-2 py-1 text-xs font-bold tabular-nums text-jam-blue">{formatTime(item.timestampSeconds ?? 0)}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold text-white/42">@{item.userId === currentUserId ? "sen" : item.authorHandle}</span>
              <span className="mt-1 block text-sm text-white/76">{item.content}</span>
            </span>
          </button>
        )) : <p className="rounded-md border border-dashed border-white/10 p-5 text-sm text-white/42">Bu versiyonda henüz yorum yok.</p>}
      </div>
    </div>
  );
}

function formatTime(value: number) {
  if (!Number.isFinite(value)) return "0:00";
  const seconds = Math.max(0, Math.floor(value));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
