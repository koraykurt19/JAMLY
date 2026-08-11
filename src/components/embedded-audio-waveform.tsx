"use client";

import { Pause, Play } from "lucide-react";
import type { ChangeEvent, PointerEvent } from "react";
import { useMemo, useRef, useState } from "react";
import { useI18n } from "@/components/language-provider";

type EmbeddedAudioWaveformProps = {
  title: string;
  seed: string;
  currentTime: number;
  duration: number;
  isActive: boolean;
  isPlaying: boolean;
  disabled: boolean;
  onToggle: () => void;
  onSeek: (time: number) => void;
};

export function EmbeddedAudioWaveform({
  title,
  seed,
  currentTime,
  duration,
  isActive,
  isPlaying,
  disabled,
  onToggle,
  onSeek
}: EmbeddedAudioWaveformProps) {
  const { language } = useI18n();
  const bars = useMemo(() => createWaveformBars(seed, 42), [seed]);
  const scrubbingRef = useRef(false);
  const [scrubTime, setScrubTime] = useState<number | null>(null);
  const visibleTime = scrubTime ?? currentTime;
  const progress = isActive && duration > 0 ? visibleTime / duration : 0;

  function previewSeek(event: ChangeEvent<HTMLInputElement>) {
    const nextTime = Number(event.target.value);
    if (scrubbingRef.current) {
      setScrubTime(nextTime);
      return;
    }
    onSeek(nextTime);
  }

  function startScrub(event: PointerEvent<HTMLInputElement>) {
    scrubbingRef.current = true;
    setScrubTime(Number(event.currentTarget.value));
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function finishScrub(event: PointerEvent<HTMLInputElement>) {
    if (!scrubbingRef.current) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    scrubbingRef.current = false;
    setScrubTime(null);
    onSeek(Number(event.currentTarget.value));
  }

  return (
    <div className="flex min-h-14 items-center gap-3 border-t border-white/[0.08] bg-[#0d1118] px-3">
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className="focus-ring flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-black transition hover:bg-jam-mint disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30"
        aria-label={
          disabled
            ? language === "tr"
              ? "Ses önizlemesi bulunmuyor"
              : "No audio preview"
            : isPlaying
              ? `${title} ${language === "tr" ? "duraklat" : "pause"}`
              : `${title} ${language === "tr" ? "oynat" : "play"}`
        }
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
      </button>

      <div className="relative flex h-10 min-w-0 flex-1 items-center gap-[3px] overflow-hidden rounded-md">
        <div className="pointer-events-none flex h-full w-full items-center gap-[3px]" aria-hidden="true">
          {bars.map((height, index) => (
            <span
              key={`${seed}-${index}`}
              className={`min-w-0 flex-1 rounded-full transition-colors duration-150 ${
                index / bars.length <= progress ? "bg-jam-mint" : "bg-white/20"
              }`}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
        <input
          type="range"
          min="0"
          max={duration || 0}
          step="0.01"
          value={isActive && duration > 0 ? visibleTime : 0}
          onChange={previewSeek}
          onPointerDown={startScrub}
          onPointerUp={finishScrub}
          onPointerCancel={finishScrub}
          disabled={!isActive || duration <= 0}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-default"
          aria-label={`${title} ${language === "tr" ? "zaman çizelgesi" : "timeline"}`}
        />
      </div>

      <span className="w-[4.75rem] shrink-0 text-right text-[11px] font-medium tabular-nums text-white/46">
        {isActive && duration > 0
          ? `${formatTime(visibleTime)} / ${formatTime(duration)}`
          : language === "tr"
            ? "Önizleme"
            : "Preview"}
      </span>
    </div>
  );
}

function createWaveformBars(seed: string, count: number) {
  let state = Array.from(seed).reduce(
    (hash, character) => (hash * 31 + character.charCodeAt(0)) >>> 0,
    2166136261
  );

  return Array.from({ length: count }, (_, index) => {
    state = (state * 1664525 + 1013904223 + index) >>> 0;
    const randomHeight = 24 + (state % 70);
    const envelope = Math.sin(((index + 1) / (count + 1)) * Math.PI);
    return Math.round(Math.max(18, randomHeight * (0.68 + envelope * 0.32)));
  });
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const rounded = Math.floor(seconds);
  return `${Math.floor(rounded / 60)}:${(rounded % 60).toString().padStart(2, "0")}`;
}
