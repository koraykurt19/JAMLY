"use client";

import Link from "next/link";
import {
  Heart,
  Pause,
  Play,
  Volume1,
  Volume2,
  X
} from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import { useI18n } from "@/components/language-provider";
import { ShortlistButton } from "@/components/shortlist-button";
import { SafeImage } from "@/components/safe-image";

export type AudioPlayerTrack = {
  id: string;
  src: string;
  title: string;
  creatorHandle?: string;
  coverImageUrl?: string;
  listingHref?: string;
  listingId?: string;
};

type AudioPlayerContextValue = {
  activeTrack: AudioPlayerTrack | null;
  currentTime: number;
  duration: number;
  error: string | null;
  isPlaying: boolean;
  playTrack: (track: AudioPlayerTrack) => Promise<void>;
  togglePlayback: () => Promise<void>;
  seek: (time: number) => void;
};

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pendingPlayRef = useRef(false);
  const [activeTrack, setActiveTrack] = useState<AudioPlayerTrack | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.82);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !activeTrack) return;

    setCurrentTime(0);
    setDuration(0);
    setError(null);
    audio.load();

    if (pendingPlayRef.current) {
      pendingPlayRef.current = false;
      void audio.play().catch(() => {
        setError("Ses önizlemesi başlatılamadı.");
        setIsPlaying(false);
      });
    }
  }, [activeTrack]);

  const playTrack = useCallback(
    async (track: AudioPlayerTrack) => {
      if (!track.src.trim()) {
        setError("Bu ilan için ses önizlemesi bulunmuyor.");
        return;
      }

      const audio = audioRef.current;
      if (activeTrack?.id === track.id && audio) {
        if (audio.paused) {
          await audio.play().catch(() => {
            setError("Ses önizlemesi başlatılamadı.");
          });
        } else {
          audio.pause();
        }
        return;
      }

      pendingPlayRef.current = true;
      setActiveTrack(track);
    },
    [activeTrack?.id]
  );

  const togglePlayback = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !activeTrack) return;

    if (audio.paused) {
      await audio.play().catch(() => {
        setError("Ses önizlemesi başlatılamadı.");
      });
    } else {
      audio.pause();
    }
  }, [activeTrack]);

  const seek = useCallback(
    (time: number) => {
      const audio = audioRef.current;
      if (!audio) return;

      const safeTime =
        duration > 0 ? Math.min(Math.max(time, 0), duration) : Math.max(time, 0);
      audio.currentTime = safeTime;
      setCurrentTime(safeTime);
    },
    [duration]
  );

  const value = useMemo<AudioPlayerContextValue>(
    () => ({
      activeTrack,
      currentTime,
      duration,
      error,
      isPlaying,
      playTrack,
      togglePlayback,
      seek
    }),
    [
      activeTrack,
      currentTime,
      duration,
      error,
      isPlaying,
      playTrack,
      seek,
      togglePlayback
    ]
  );

  function closePlayer() {
    audioRef.current?.pause();
    setActiveTrack(null);
    setCurrentTime(0);
    setDuration(0);
    setError(null);
  }

  return (
    <AudioPlayerContext.Provider value={value}>
      <div className={activeTrack ? "pb-24 sm:pb-28" : undefined}>{children}</div>
      <audio
        ref={audioRef}
        src={activeTrack?.src}
        preload="metadata"
        onLoadedMetadata={(event) => {
          const nextDuration = event.currentTarget.duration;
          setDuration(Number.isFinite(nextDuration) ? nextDuration : 0);
        }}
        onDurationChange={(event) => {
          const nextDuration = event.currentTarget.duration;
          setDuration(Number.isFinite(nextDuration) ? nextDuration : 0);
        }}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onPlay={() => {
          setIsPlaying(true);
          setError(null);
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          if (audioRef.current) audioRef.current.currentTime = 0;
          setCurrentTime(0);
          setIsPlaying(false);
        }}
        onError={() => {
          setError("Ses dosyası yüklenemedi.");
          setIsPlaying(false);
        }}
      />
      {activeTrack ? (
        <PersistentAudioPlayer
          track={activeTrack}
          currentTime={currentTime}
          duration={duration}
          error={error}
          isPlaying={isPlaying}
          volume={volume}
          onToggle={() => void togglePlayback()}
          onSeek={seek}
          onVolumeChange={(nextVolume) => {
            setVolume(nextVolume);
          }}
          onClose={closePlayer}
        />
      ) : null}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error("useAudioPlayer must be used inside AudioPlayerProvider");
  }
  return context;
}

function PersistentAudioPlayer({
  track,
  currentTime,
  duration,
  error,
  isPlaying,
  volume,
  onToggle,
  onSeek,
  onVolumeChange,
  onClose
}: {
  track: AudioPlayerTrack;
  currentTime: number;
  duration: number;
  error: string | null;
  isPlaying: boolean;
  volume: number;
  onToggle: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onClose: () => void;
}) {
  const { language } = useI18n();
  const VolumeIcon = volume > 0.45 ? Volume2 : Volume1;

  return (
    <aside
      className="fixed inset-x-0 bottom-0 z-[65] border-t border-white/10 bg-[#0b0f16]/96 shadow-[0_-20px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl"
      aria-label={language === "tr" ? "Jamly ses oynatıcısı" : "Jamly audio player"}
    >
      <div className="mx-auto grid min-h-20 w-full max-w-[1440px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2 sm:min-h-24 sm:grid-cols-[minmax(0,0.82fr)_minmax(15rem,1.2fr)_minmax(0,0.82fr)] sm:gap-5 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {track.coverImageUrl ? (
            <SafeImage
              src={track.coverImageUrl}
              alt=""
              width={56}
              height={56}
              sizes="56px"
              className="h-12 w-12 shrink-0 rounded-md border border-white/10 object-cover sm:h-14 sm:w-14"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.05] text-jam-mint sm:h-14 sm:w-14">
              <Heart size={18} />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{track.title}</p>
            {track.creatorHandle ? (
              <p className="mt-0.5 truncate text-xs text-white/48">
                @{track.creatorHandle}
              </p>
            ) : null}
            {error ? (
              <p className="mt-0.5 truncate text-xs text-red-300">{error}</p>
            ) : null}
          </div>
        </div>

        <div className="hidden min-w-0 items-center gap-3 sm:flex">
          <button
            type="button"
            onClick={onToggle}
            className="focus-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-black transition hover:bg-jam-mint"
            aria-label={isPlaying ? "Duraklat" : "Oynat"}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
          </button>
          <span className="w-10 text-right text-xs tabular-nums text-white/46">
            {formatPlayerTime(currentTime)}
          </span>
          <input
            type="range"
            min="0"
            max={duration || 0}
            step="0.01"
            value={duration ? currentTime : 0}
            onChange={(event) => onSeek(Number(event.target.value))}
            className="audio-progress h-11 min-w-0 flex-1 cursor-pointer"
            aria-label={language === "tr" ? "Oynatma konumu" : "Playback position"}
          />
          <span className="w-10 text-xs tabular-nums text-white/46">
            {formatPlayerTime(duration)}
          </span>
        </div>

        <div className="flex items-center justify-end gap-1 sm:gap-2">
          <button
            type="button"
            onClick={onToggle}
            className="focus-ring flex h-11 w-11 items-center justify-center rounded-full bg-white text-black sm:hidden"
            aria-label={isPlaying ? "Duraklat" : "Oynat"}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
          </button>
          <div className="hidden items-center gap-2 lg:flex">
            <VolumeIcon size={17} className="text-white/48" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={volume}
              onChange={(event) => onVolumeChange(Number(event.target.value))}
              className="audio-progress w-20 cursor-pointer"
              aria-label={language === "tr" ? "Ses seviyesi" : "Volume"}
            />
          </div>
          {track.listingId ? (
            <ShortlistButton listingId={track.listingId} compact />
          ) : null}
          {track.listingHref ? (
            <Link
              href={track.listingHref}
              className="focus-ring hidden min-h-11 items-center rounded-md border border-white/10 px-4 text-xs font-semibold text-white/72 transition hover:border-jam-blue/40 hover:bg-jam-blue/10 hover:text-white md:inline-flex"
            >
              {language === "tr" ? "Detayları gör" : "View details"}
            </Link>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="focus-ring flex h-11 w-11 items-center justify-center rounded-md text-white/44 transition hover:bg-white/8 hover:text-white"
            aria-label={language === "tr" ? "Oynatıcıyı kapat" : "Close player"}
          >
            <X size={18} />
          </button>
        </div>
      </div>
      <input
        type="range"
        min="0"
        max={duration || 0}
        step="0.01"
        value={duration ? currentTime : 0}
        onChange={(event) => onSeek(Number(event.target.value))}
        className="audio-progress absolute inset-x-0 top-0 h-1 w-full cursor-pointer sm:hidden"
        aria-label={language === "tr" ? "Oynatma konumu" : "Playback position"}
      />
    </aside>
  );
}

function formatPlayerTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const rounded = Math.floor(seconds);
  return `${Math.floor(rounded / 60)}:${(rounded % 60).toString().padStart(2, "0")}`;
}
