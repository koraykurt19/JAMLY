import Image from "next/image";
import { cn } from "@/lib/format";

const JAMLY_LOGO_SRC = "/brand/jamly-logo.png";

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
      width={1254}
      height={1254}
      priority={priority}
      sizes="44px"
      className={cn("h-9 w-9 rounded-xl object-contain", className)}
    />
  );
}

export function JamlyWordmark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <JamlyLogoMark priority />
      <span className="text-lg font-semibold tracking-tight text-white">Jamly</span>
    </div>
  );
}
