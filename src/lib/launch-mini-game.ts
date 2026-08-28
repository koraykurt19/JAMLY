export type BeatPad = "kick" | "snare" | "hat" | "bass";

export const beatPads: BeatPad[] = ["kick", "snare", "hat", "bass"];

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
