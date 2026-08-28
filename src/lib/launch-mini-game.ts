export type BeatPad = "kick" | "snare" | "hat" | "bass";
export type LaunchChallengeKey = "profile" | "referral" | "drop";
export type LaunchChallengeTier = "starter" | "warm" | "priority" | "alpha";

export const beatPads: BeatPad[] = ["kick", "snare", "hat", "bass"];
export const launchChallengeKeys: LaunchChallengeKey[] = ["profile", "referral", "drop"];

export function buildBeatSequence(round: number): BeatPad[] {
  const length = Math.min(2 + Math.max(1, Math.floor(round)), 7);
  return Array.from({ length }, (_, index) => beatPads[(round + index * 2) % beatPads.length]);
}

export function scoreBeatAttempt(sequence: BeatPad[], attempt: BeatPad[]) {
  const correct = sequence.every((pad, index) => attempt[index] === pad);
  const completed = attempt.length >= sequence.length;

  return {
    correct,
    completed,
    points: correct && completed ? sequence.length * 120 : 0
  };
}

export function launchBenefitForScore(score: number, language: "tr" | "en") {
  if (score >= 2400) {
    return language === "tr" ? "Studio Alpha rozeti" : "Studio Alpha badge";
  }

  if (score >= 1200) {
    return language === "tr" ? "Erken dalga onceligi" : "Early wave priority";
  }

  return language === "tr" ? "Kurucu liste kaydi" : "Founding list signal";
}

export function launchChallengeTier(completed: LaunchChallengeKey[]): LaunchChallengeTier {
  const unique = new Set(completed);
  if (unique.size >= 3) return "alpha";
  if (unique.size === 2) return "priority";
  if (unique.size === 1) return "warm";
  return "starter";
}

export function launchChallengeBenefit(tier: LaunchChallengeTier, language: "tr" | "en") {
  if (language === "tr") {
    if (tier === "alpha") return "Alpha dalga sinyali";
    if (tier === "priority") return "Oncelikli davet sinyali";
    if (tier === "warm") return "Kurucu avantaj sinyali";
    return "On kayit baslangici";
  }

  if (tier === "alpha") return "Alpha wave signal";
  if (tier === "priority") return "Priority invite signal";
  if (tier === "warm") return "Founder perk signal";
  return "Pre-register start";
}
