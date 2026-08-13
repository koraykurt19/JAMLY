"use client";

import { useEffect, useState } from "react";
import {
  Award,
  BadgeCheck,
  Building2,
  Crown,
  FlaskConical,
  Handshake,
  Heart,
  HeartHandshake,
  Medal,
  PieChart,
  Repeat,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  TrendingUp,
  Users,
  Zap
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useI18n } from "@/components/language-provider";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import {
  badgeCategoryLabels,
  badgeDescription,
  badgeName,
  badgeRarityLabels,
  mapBadgeRow,
  sortBadgesForProfile,
  type BadgeTone,
  type ProfileBadge
} from "@/lib/badges";
import { cn } from "@/lib/format";

const badgeIcons: Record<string, LucideIcon> = {
  crown: Crown,
  medal: Medal,
  "badge-check": BadgeCheck,
  "shield-check": ShieldCheck,
  "heart-handshake": HeartHandshake,
  "flask-conical": FlaskConical,
  rocket: Rocket,
  sparkles: Sparkles,
  "trending-up": TrendingUp,
  trophy: Trophy,
  zap: Zap,
  star: Star,
  repeat: Repeat,
  users: Users,
  handshake: Handshake,
  "pie-chart": PieChart,
  heart: Heart,
  "building-2": Building2,
  award: Award
};

const toneClass: Record<BadgeTone, string> = {
  brand: "border-jam-blue/32 bg-jam-blue/12 text-jam-mint",
  success: "border-jam-success/32 bg-jam-success/12 text-jam-success",
  gold: "border-jam-gold/34 bg-jam-gold/12 text-jam-gold",
  coral: "border-jam-coral/32 bg-jam-coral/12 text-jam-coral",
  neutral: "border-white/12 bg-white/[0.06] text-white/76"
};

/** Compact inline badge — used next to a name in cards and headers. */
export function BadgeChip({ badge, showLabel = true }: { badge: ProfileBadge; showLabel?: boolean }) {
  const { language } = useI18n();
  const Icon = badgeIcons[badge.icon] ?? Award;
  const label = badgeName(badge, language);

  return (
    <span
      title={`${label} — ${badgeDescription(badge, language)}`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-[12px] font-semibold",
        toneClass[badge.tone]
      )}
    >
      <Icon size={13} aria-hidden />
      {showLabel ? label : <span className="sr-only">{label}</span>}
    </span>
  );
}

/** Full badge card used in the profile showcase. */
export function BadgeCard({ badge }: { badge: ProfileBadge }) {
  const { language } = useI18n();
  const Icon = badgeIcons[badge.icon] ?? Award;

  return (
    <div className="flex gap-3 rounded-lg border border-white/8 bg-jam-surface/72 p-4">
      <span
        aria-hidden
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-md border",
          toneClass[badge.tone]
        )}
      >
        <Icon size={19} />
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="text-sm font-semibold text-white">{badgeName(badge, language)}</p>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-white/38">
            {badgeRarityLabels[language][badge.rarity]}
          </span>
        </div>
        <p className="mt-1 text-[13px] leading-5 text-white/60">
          {badgeDescription(badge, language)}
        </p>
      </div>
    </div>
  );
}

/**
 * Profile badge showcase. Groups by category so verification reads separately
 * from achievements, which is what a buyer is actually scanning for.
 */
export function ProfileBadgeShowcase({ profileId }: { profileId: string }) {
  const { language } = useI18n();
  const badges = useProfileBadges(profileId);

  if (badges.length === 0) return null;

  const grouped = new Map<ProfileBadge["category"], ProfileBadge[]>();
  for (const badge of sortBadgesForProfile(badges)) {
    const bucket = grouped.get(badge.category) ?? [];
    bucket.push(badge);
    grouped.set(badge.category, bucket);
  }

  return (
    <section aria-label={language === "tr" ? "Rozetler" : "Badges"} className="flex flex-col gap-5">
      {[...grouped.entries()].map(([category, items]) => (
        <div key={category}>
          <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
            {badgeCategoryLabels[language][category]}
          </h3>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {items.map((badge) => (
              <BadgeCard key={badge.key} badge={badge} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

/** Inline row of badge chips, capped so a decorated profile stays readable. */
export function BadgeChipRow({ profileId, limit = 4 }: { profileId: string; limit?: number }) {
  const badges = useProfileBadges(profileId);
  if (badges.length === 0) return null;

  const sorted = sortBadgesForProfile(badges);
  const visible = sorted.slice(0, limit);
  const overflow = sorted.length - visible.length;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {visible.map((badge) => (
        <BadgeChip key={badge.key} badge={badge} />
      ))}
      {overflow > 0 ? (
        <span className="text-[12px] font-semibold text-white/44">+{overflow}</span>
      ) : null}
    </div>
  );
}

function useProfileBadges(profileId: string) {
  const [badges, setBadges] = useState<ProfileBadge[]>([]);

  useEffect(() => {
    if (!profileId || !isSupabaseConfigured()) return;
    const client = getSupabaseBrowserClient();
    if (!client) return;

    let active = true;
    async function load() {
      try {
        const { data, error } = await client!.rpc("get_profile_badges", {
          p_profile_id: profileId
        });
        if (!active || error || !Array.isArray(data)) return;
        setBadges(data.map(mapBadgeRow));
      } catch {
        // Badges are additive decoration; a failure must not break the profile.
      }
    }
    void load();

    return () => {
      active = false;
    };
  }, [profileId]);

  return badges;
}
