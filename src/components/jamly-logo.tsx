import Image from "next/image";
import { cn } from "@/lib/format";

const JAMLY_LOGO_SRC = "/brand/jamly-logo-20260730.png";

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
    <Image
      src={JAMLY_LOGO_SRC}
      alt={alt}
      width={1024}
      height={1024}
      priority={priority}
      sizes="52px"
      className={cn("h-11 w-11 rounded-xl object-contain", className)}
    />
  );
}

export function JamlyWordmark({ className }: { className?: string }) {
  return (
    <div className={cn("inline-flex items-center", className)} aria-label="Jamly">
      <span
        aria-hidden="true"
        className="bg-gradient-to-r from-[#2d8cff] via-[#37b7f2] to-[#52e0db] bg-clip-text text-[1.72rem] font-black italic leading-none tracking-[0.08em] text-transparent sm:text-[1.9rem]"
        style={{ textShadow: "0 0 26px rgb(45 140 255 / 0.22)" }}
      >
        JAMLY
      </span>
      <span className="sr-only">Jamly</span>
    </div>
  );
}
