"use client";

import Link from "next/link";
import {
  AudioLines,
  Cloud,
  ExternalLink,
  Globe2,
  Instagram,
  Video,
  Youtube,
  type LucideIcon
} from "lucide-react";
import type { SocialLink, SocialLinkPlatform, SocialPlatform } from "@/lib/social-links";
import { cn } from "@/lib/format";

const socialIcons: Record<SocialPlatform, LucideIcon> = {
  spotify: AudioLines,
  instagram: Instagram,
  tiktok: Video,
  youtube: Youtube,
  soundcloud: Cloud,
  website: Globe2
};

type SocialLinkListProps = {
  links: SocialLink[];
  compact?: boolean;
};

export function SocialLinkList({ links, compact = false }: SocialLinkListProps) {
  if (links.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) => {
        const Icon = getSocialIcon(link.platform);
        return (
          <Link
            key={`${link.platform}-${link.url}`}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-black/28 font-semibold text-white/68 transition hover:border-jam-blue/35 hover:bg-jam-blue/10 hover:text-white",
              compact ? "px-3 py-2 text-xs" : "px-4 py-2 text-sm"
            )}
            aria-label={link.label}
          >
            <Icon size={compact ? 14 : 16} />
            {link.label}
            {!compact ? <ExternalLink size={14} className="text-white/38" /> : null}
          </Link>
        );
      })}
    </div>
  );
}

function getSocialIcon(platform: SocialLinkPlatform) {
  return platform === "custom" ? Globe2 : socialIcons[platform];
}
