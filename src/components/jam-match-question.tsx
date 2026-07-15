"use client";

import {
  ArrowRight,
  Check,
  CircleDollarSign,
  Clock3,
  Guitar,
  Megaphone,
  Mic2,
  PackageOpen,
  PenLine,
  Radio,
  SlidersHorizontal,
  Sparkles,
  UserRoundCog,
  type LucideIcon
} from "lucide-react";
import { cn } from "@/lib/format";
import type { Language } from "@/lib/i18n";
import {
  jamMatchCopy,
  type JamMatchAnswers,
  type JamMatchOptionIcon,
  type JamMatchStep,
  type JamMatchStepOption
} from "@/lib/jam-match-onboarding";

const optionIcons: Record<JamMatchOptionIcon, LucideIcon> = {
  beat: Radio,
  vocal: Mic2,
  lyrics: PenLine,
  mix: SlidersHorizontal,
  guitar: Guitar,
  jingle: Megaphone,
  pack: PackageOpen,
  producer: UserRoundCog,
  money: CircleDollarSign,
  clock: Clock3,
  generic: Sparkles
};

export function JamMatchProgress({
  stepIndex,
  stepCount,
  dataLabel,
  isLoading,
  language
}: {
  stepIndex: number;
  stepCount: number;
  dataLabel: string;
  isLoading: boolean;
  language: Language;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs font-semibold text-white/44">
          {language === "tr" ? "Eşleşme profili" : "Match profile"}
        </span>
        <span className="inline-flex items-center gap-2 text-xs text-white/40">
          {isLoading ? (
            <span className="h-2 w-2 animate-pulse rounded-full bg-jam-blue" />
          ) : null}
          {dataLabel}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-5 gap-2" aria-hidden="true">
        {Array.from({ length: stepCount }).map((_, index) => (
          <span
            key={index}
            className={cn(
              "h-1 rounded-full transition-colors",
              index <= stepIndex ? "bg-jam-mint" : "bg-white/10"
            )}
          />
        ))}
      </div>
    </div>
  );
}

export function JamMatchAnswerOption({
  option,
  active,
  selectedLabel,
  onClick
}: {
  option: JamMatchStepOption;
  active: boolean;
  selectedLabel: string;
  onClick: () => void;
}) {
  const Icon = optionIcons[option.icon ?? "generic"];
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "focus-ring group flex min-h-20 items-center gap-4 rounded-lg border p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition",
        active
          ? "border-jam-mint bg-[linear-gradient(135deg,rgba(88,197,255,0.22),rgba(122,167,255,0.10))]"
          : "border-white/10 bg-black/28 hover:-translate-y-0.5 hover:border-jam-blue/35 hover:bg-jam-blue/10"
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-md border",
          active
            ? "border-jam-mint/40 bg-jam-mint text-black"
            : "border-white/10 bg-white/[0.055] text-jam-blue"
        )}
      >
        {active ? <Check size={18} /> : <Icon size={19} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-white">{option.label}</span>
        {option.description ? (
          <span className="mt-1 block text-xs leading-5 text-white/44">{option.description}</span>
        ) : null}
      </span>
      <span className="sr-only">{active ? selectedLabel : ""}</span>
      <ArrowRight
        size={17}
        className="shrink-0 text-white/24 transition group-hover:translate-x-0.5 group-hover:text-white/60"
      />
    </button>
  );
}

export function JamMatchBriefSummary({
  answers,
  steps,
  activeStep,
  onEditStep,
  language
}: {
  answers: JamMatchAnswers;
  steps: JamMatchStep[];
  activeStep: number;
  onEditStep: (index: number) => void;
  language: Language;
}) {
  const text = jamMatchCopy[language];
  return (
    <aside className="h-fit rounded-lg border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(0,0,0,0.24))] p-5 shadow-soft lg:sticky lg:top-24">
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-jam-mint" />
        <h2 className="font-semibold text-white">{text.yourBrief}</h2>
      </div>
      <p className="mt-2 text-xs leading-5 text-white/42">{text.briefHint}</p>
      <div className="mt-5 divide-y divide-white/8">
        {steps.map((step, index) => {
          const value = answers[step.id];
          const selectedOption = step.options.find((option) => option.id === value);
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onEditStep(index)}
              className={cn(
                "focus-ring flex w-full items-start gap-3 py-3 text-left transition hover:text-white",
                index === activeStep ? "text-white" : "text-white/54"
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                  value ? "bg-jam-mint text-black" : "bg-white/8 text-white/42"
                )}
              >
                {value ? <Check size={12} /> : index + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-xs text-white/34">{step.question}</span>
                <span className="mt-1 block text-sm font-semibold">
                  {selectedOption?.label ?? text.waiting}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
