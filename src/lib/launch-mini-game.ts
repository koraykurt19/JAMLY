export type BeatPad = "kick" | "snare" | "hat" | "bass";
export type LaunchChallengeKey = "profile" | "referral" | "drop";
export type LaunchChallengeTier = "starter" | "warm" | "priority" | "alpha";
export type LaunchPriority = "A" | "B" | "C";

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

export function launchReadinessScore(input: {
  priority?: LaunchPriority;
  readiness?: "ready" | "soon" | "explore";
  beatScore?: number;
  beatAccuracy?: number;
  beatBestStreak?: number;
  challengeTier?: LaunchChallengeTier;
  completedChallenges?: readonly LaunchChallengeKey[];
}) {
  let score = 0;

  if (input.priority === "A") score += 30;
  else if (input.priority === "B") score += 22;
  else if (input.priority === "C") score += 14;

  if (input.readiness === "ready") score += 20;
  else if (input.readiness === "soon") score += 14;
  else if (input.readiness === "explore") score += 8;

  if (input.challengeTier === "alpha") score += 20;
  else if (input.challengeTier === "priority") score += 14;
  else if (input.challengeTier === "warm") score += 8;

  const completed = new Set(input.completedChallenges ?? []).size;
  score += Math.min(completed * 5, 15);

  const beatScore = Math.max(Number(input.beatScore ?? 0), 0);
  if (beatScore >= 2400) score += 8;
  else if (beatScore >= 1200) score += 5;
  else if (beatScore >= 120) score += 3;

  const accuracy = Math.max(Number(input.beatAccuracy ?? 0), 0);
  if (accuracy >= 90) score += 5;
  else if (accuracy >= 75) score += 3;

  if (Math.max(Number(input.beatBestStreak ?? 0), 0) >= 3) score += 2;

  return Math.max(0, Math.min(100, score));
}
