"use client";

import { Loader2, UserCheck, UserPlus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/language-provider";
import { useCurrentAccount } from "@/lib/use-current-account";
import { useCreatorFollow } from "@/lib/use-creator-follow";

export function CreatorFollowButton({
  creatorId,
  creatorHandle
}: {
  creatorId: string;
  creatorHandle: string;
}) {
  const { language } = useI18n();
  const router = useRouter();
  const account = useCurrentAccount();
  const viewerId =
    account.state.status === "signed-in" ? account.state.profile.id : null;
  const follow = useCreatorFollow({ creatorId, viewerId });
  const countLabel = language === "tr" ? "takipçi" : "followers";

  async function handleToggle() {
    const result = await follow.toggle();
    if (result === "auth-required") {
      const destination = encodeURIComponent(`/creators/${creatorHandle}`);
      router.push(`/auth/sign-in?next=${destination}`);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!follow.isOwnProfile ? (
        <button
          type="button"
          onClick={() => void handleToggle()}
          disabled={follow.loading || follow.saving}
          className={`focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold transition disabled:cursor-wait disabled:opacity-60 ${
            follow.isFollowing
              ? "border border-jam-blue/35 bg-jam-blue/12 text-white hover:bg-jam-blue/20"
              : "bg-jam-blue text-white hover:bg-jam-mint hover:text-[#071018]"
          }`}
          aria-pressed={follow.isFollowing}
        >
          {follow.loading || follow.saving ? (
            <Loader2 size={17} className="animate-spin" />
          ) : follow.isFollowing ? (
            <UserCheck size={17} />
          ) : (
            <UserPlus size={17} />
          )}
          {follow.isFollowing
            ? language === "tr"
              ? "Takip ediliyor"
              : "Following"
            : language === "tr"
              ? "Takip et"
              : "Follow"}
        </button>
      ) : null}
      <span
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-black/24 px-4 text-sm font-semibold text-white/62"
        title={follow.error ?? undefined}
      >
        <Users size={16} className="text-jam-blue" />
        {follow.loading ? "—" : follow.followerCount.toLocaleString(language)} {countLabel}
      </span>
    </div>
  );
}
