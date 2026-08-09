"use client";

import { AlertCircle, Pause, Play } from "lucide-react";
import type { ChangeEvent, PointerEvent } from "react";
import { useMemo, useRef, useState } from "react";
import { cn } from "@/lib/format";
import { useI18n } from "@/components/language-provider";
import {
  useAudioPlayer,
  type AudioPlayerTrack
} from "@/components/audio-player-provider";
import type { AudioMarker } from "@/lib/types";

type AudioPreviewProps = {
  src: string;
  title: string;
  compact?: boolean;
  markers?: AudioMarker[];
  track?: Omit<AudioPlayerTrack, "src" | "title">;
};

export function AudioPreview({
  src,
  title,
  compact = false,
  markers = [],
  track
}: AudioPreviewProps) {
  const { language, t } = useI18n();
  const player = useAudioPlayer();
  const isScrubbingRef = useRef(false);
  const [scrubTime, setScrubTime] = useState<number | null>(null);
  const trackId = track?.id ?? `${title}-${src}`;
  const isActive = player.activeTrack?.id === trackId;
  const isPlaying = isActive && player.isPlaying;
  const currentTime = isActive ? player.currentTime : 0;
  const duration = isActive ? player.duration : 0;
  const error = isActive ? player.error : null;
  const visibleTime = scrubTime ?? currentTime;
  const progress = useMemo(
    () => (duration > 0 ? (visibleTime / duration) * 100 : 0),
    [duration, visibleTime]
  );

  async function toggle() {
    await player.playTrack({ id: trackId, src, title, ...track });
  }

  function previewSeek(event: ChangeEvent<HTMLInputElement>) {
    const nextTime = getSafeTime(Number(event.target.value), duration);

    if (isScrubbingRef.current) {
      setScrubTime(nextTime);
      return;
    }

    commitSeek(nextTime);
  }

  function startScrub(event: PointerEvent<HTMLInputElement>) {
    isScrubbingRef.current = true;
    setScrubTime(getSafeTime(Number(event.currentTarget.value), duration));

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function finishScrub(event: PointerEvent<HTMLInputElement>) {
    if (!isScrubbingRef.current) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    commitSeek(getSafeTime(Number(event.currentTarget.value), duration));
  }

  function commitSeek(nextTime: number) {
    const safeTime = getSafeTime(nextTime, duration);

    isScrubbingRef.current = false;
    setScrubTime(null);
    if (isActive) player.seek(safeTime);
  }

  function jumpToMarker(time: number) {
    commitSeek(time);
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-white/10 bg-black/24 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
        compact ? "p-3" : "p-4"
      )}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          disabled={!src.trim()}
          className="focus-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-black transition hover:bg-jam-mint disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30"
          aria-label={
            isPlaying
              ? language === "tr"
                ? `${title} duraklat`
                : `Pause ${title}`
              : language === "tr"
                ? `${title} oynat`
                : `Play ${title}`
          }
        >
          {error ? (
            <AlertCircle size={18} />
          ) : isPlaying ? (
            <Pause size={18} />
          ) : (
            <Play size={18} fill="currentColor" />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-4 text-xs text-white/48">
            <span className="truncate">{title}</span>
            <span className="shrink-0 font-medium tabular-nums text-white/62">
              {formatTime(visibleTime)} / {formatTime(duration)}
            </span>
          </div>
          <div className="group relative mt-2 h-10 overflow-hidden rounded-full border border-white/10 bg-white/[0.045] px-3 transition hover:border-white/18 hover:bg-white/[0.065] focus-within:ring-2 focus-within:ring-jam-mint/30">
            <div className="pointer-events-none relative h-full">
              <div
                className="absolute inset-y-[7px] left-0 rounded-full bg-gradient-to-r from-jam-mint/28 to-jam-blue/22"
                style={{ width: `${progress}%` }}
              />
              <div className="waveform absolute inset-x-0 top-1/2 h-5 -translate-y-1/2 opacity-70 transition group-hover:opacity-95" />
              <div
                className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/30 bg-white shadow-[0_0_0_4px_rgba(255,255,255,0.12)] transition group-hover:scale-110"
                style={{ left: `${progress}%` }}
              />
            </div>
            <input
              type="range"
              min="0"
              max={duration || 0}
              step="0.01"
              value={duration ? visibleTime : 0}
              onChange={previewSeek}
              onPointerDown={startScrub}
              onPointerUp={finishScrub}
              onPointerCancel={finishScrub}
              className="audio-scrubber absolute inset-0 h-full w-full cursor-pointer opacity-0"
              aria-label={
                language === "tr"
                  ? `${title} zaman çizelgesi`
                  : `${title} timeline`
              }
            />
          </div>

          {!compact && markers.length > 0 ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/34">
                {t("audioMarkersHint")}
              </span>
              {markers.map((marker) => (
                <button
                  key={`${marker.label}-${marker.time}`}
                  type="button"
                  onClick={() => jumpToMarker(marker.time)}
                  className="focus-ring rounded-full border border-white/10 bg-black/26 px-3 py-1 text-xs font-semibold text-white/60 transition hover:border-jam-mint/45 hover:bg-jam-mint/10 hover:text-white"
                >
                  {marker.label} · {formatTime(marker.time)}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function getSafeTime(value: number, duration: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  if (!Number.isFinite(duration) || duration <= 0) {
    return Math.max(0, value);
  }

  return Math.min(Math.max(value, 0), duration);
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "0:00";
  }

  const rounded = Math.floor(seconds);
  const minutes = Math.floor(rounded / 60);
  const remainingSeconds = rounded % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}
