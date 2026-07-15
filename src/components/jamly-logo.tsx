import Image from "next/image";
import { cn } from "@/lib/format";

const JAMLY_LOGO_MARK_SRC = "/brand/jamly-logo-mark-20260715.png";

export function JamlyLogoMark({
  alt = "",
  className,
  priority = false
}: {
  alt?: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-black p-2 shadow-[0_14px_36px_rgba(0,0,0,0.42)] ring-1 ring-white/10",
        className
      )}
    >
      <Image
        src={JAMLY_LOGO_MARK_SRC}
        alt={alt}
        width={1024}
        height={1024}
        priority={priority}
        sizes="52px"
        className="h-full w-full object-contain"
      />
    </span>
  );
}

export function JamlyWordmark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3.5", className)}>
      <JamlyLogoMark priority />
      <span className="text-xl font-semibold tracking-tight text-white">Jamly</span>
    </div>
  );
}
