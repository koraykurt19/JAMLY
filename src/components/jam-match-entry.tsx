"use client";

import { ArrowLeft, WandSparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/language-provider";
import {
  JamMatchAnswerOption,
  JamMatchBriefSummary,
  JamMatchProgress
} from "@/components/jam-match-question";
import { JamMatchResults } from "@/components/jam-match-results";
import { creators as demoCreators, listings as demoListings } from "@/lib/data";
import { cn } from "@/lib/format";
import { localizeCreator, localizeListing } from "@/lib/i18n";
import { findJamMatches } from "@/lib/jam-match";
import {
  emptyJamMatchAnswers,
  getJamMatchSteps,
  jamMatchBudgetOptions,
  jamMatchCopy,
  toJamMatchWorkType,
  type JamMatchAnswers
} from "@/lib/jam-match-onboarding";
import { getSupabaseBrowserClient, isSupabaseRecoverableError } from "@/lib/supabase";
import { fetchCreators, fetchMarketplaceListings } from "@/lib/supabase-data";
import type { Creator, Listing } from "@/lib/types";

type JamMatchDataState = {
  status: "loading" | "ready";
  listings: Listing[];
  creators: Creator[];
  isDemo: boolean;
  message?: string;
};

export function JamMatchEntry() {
  const { currencyCode, language, usdTryRate } = useI18n();
  const text = jamMatchCopy[language];
  const [answers, setAnswers] = useState<JamMatchAnswers>(emptyJamMatchAnswers);
  const [stepIndex, setStepIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [dataState, setDataState] = useState<JamMatchDataState>({
    status: "ready",
    listings: demoListings,
    creators: demoCreators,
    isDemo: true
  });

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) return;

    let active = true;
    setDataState({
      status: "loading",
      listings: demoListings,
      creators: demoCreators,
      isDemo: true
    });

    async function loadLiveData() {
      if (!client) return;
      try {
        const [liveListings, liveCreators] = await Promise.all([
          fetchMarketplaceListings(client),
          fetchCreators(client)
        ]);
        if (!active) return;
        setDataState({
          status: "ready",
          listings: liveListings,
          creators: liveCreators,
          isDemo: false
        });
      } catch (error) {
        if (!active) return;
        setDataState({
          status: "ready",
          listings: demoListings,
          creators: demoCreators,
          isDemo: true,
          message: isSupabaseRecoverableError(error) ? undefined : "Supabase data could not be loaded."
        });
      }
    }

    void loadLiveData();
    return () => {
      active = false;
    };
  }, []);

  const steps = useMemo(
    () => getJamMatchSteps(language, currencyCode, usdTryRate),
    [currencyCode, language, usdTryRate]
  );
  const currentStep = steps[stepIndex];
  const selectedBudget =
    jamMatchBudgetOptions.find((option) => option.id === answers.budget) ??
    jamMatchBudgetOptions[2];
  const localizedListings = useMemo(
    () => dataState.listings.map((listing) => localizeListing(listing, language)),
    [dataState.listings, language]
  );
  const localizedCreators = useMemo(
    () => dataState.creators.map((creator) => localizeCreator(creator, language)),
    [dataState.creators, language]
  );
  const matches = useMemo(
    () =>
      findJamMatches(
        {
          prompt: "",
          categoryIds: answers.need ? [answers.need] : [],
          genreId: answers.genre ?? undefined,
          budget: { min: selectedBudget.min, max: selectedBudget.max },
          deadlineId: answers.deadline ?? "flexible",
          workType: toJamMatchWorkType(answers.workType),
          language
        },
        localizedListings,
        localizedCreators
      ),
    [
      answers.deadline,
      answers.genre,
      answers.need,
      answers.workType,
      language,
      localizedCreators,
      localizedListings,
      selectedBudget.max,
      selectedBudget.min
    ]
  );
  const dataLabel =
    dataState.status === "loading"
      ? text.dataLoading
      : dataState.isDemo
        ? text.demoData
        : text.liveData;

  function selectAnswer(optionId: string) {
    setAnswers((current) => ({ ...current, [currentStep.id]: optionId }));
    if (stepIndex === steps.length - 1) {
      setShowResults(true);
      return;
    }
    setStepIndex((current) => current + 1);
  }

  function goBack() {
    if (showResults) {
      setShowResults(false);
      setStepIndex(steps.length - 1);
      return;
    }
    setStepIndex((current) => Math.max(0, current - 1));
  }

  function editStep(index: number) {
    setShowResults(false);
    setStepIndex(index);
  }

  function restart() {
    setAnswers({ ...emptyJamMatchAnswers });
    setStepIndex(0);
    setShowResults(false);
  }

  return (
    <main className="relative isolate min-h-[calc(100vh-5rem)] overflow-hidden">
      <div className="absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(circle_at_22%_8%,rgba(88,197,255,0.22),transparent_25rem),radial-gradient(circle_at_82%_0%,rgba(122,167,255,0.16),transparent_22rem),linear-gradient(180deg,rgba(88,197,255,0.10),rgba(5,6,8,0))]" />
      <div className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-jam-mint/70 to-transparent" />
      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <header className={cn("max-w-3xl", showResults ? "mb-8" : "mx-auto text-center")}>
          <p className="inline-flex items-center gap-2 rounded-full border border-jam-mint/25 bg-jam-mint/10 px-3 py-2 text-sm font-bold text-jam-mint">
            <WandSparkles size={16} />
            {text.eyebrow}
          </p>
          <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">
            {showResults ? text.resultsTitle : text.headline}
          </h1>
          <p className="mt-4 text-base leading-7 text-white/60 sm:text-lg">
            {showResults ? text.resultsCopy : text.subheadline}
          </p>
        </header>

        {showResults ? (
          <JamMatchResults
            answers={answers}
            steps={steps}
            matches={matches}
            dataLabel={dataLabel}
            isLoading={dataState.status === "loading"}
            onBack={goBack}
            onEditStep={editStep}
            onRestart={restart}
          />
        ) : (
          <div className="mx-auto mt-10 grid max-w-5xl gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <section className="relative overflow-hidden rounded-lg border border-jam-blue/20 bg-[linear-gradient(135deg,rgba(255,255,255,0.075),rgba(255,255,255,0.035))] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.32)] backdrop-blur-xl sm:p-8">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-jam-blue/80 to-transparent" />
              <JamMatchProgress
                stepIndex={stepIndex}
                stepCount={steps.length}
                dataLabel={dataLabel}
                isLoading={dataState.status === "loading"}
                language={language}
              />

              <div className="mt-8 min-h-[25rem]">
                <p className="text-sm font-semibold text-jam-blue">
                  {text.step} {stepIndex + 1} {text.of} {steps.length}
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">
                  {currentStep.question}
                </h2>
                <p className="mt-2 text-sm leading-6 text-white/50">{currentStep.helper}</p>

                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  {currentStep.options.map((option) => (
                    <JamMatchAnswerOption
                      key={option.id}
                      option={option}
                      active={answers[currentStep.id] === option.id}
                      selectedLabel={text.selected}
                      onClick={() => selectAnswer(option.id)}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
                <button
                  type="button"
                  onClick={goBack}
                  disabled={stepIndex === 0}
                  className="focus-ring inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-white/58 transition hover:bg-white/8 hover:text-white disabled:pointer-events-none disabled:opacity-0"
                >
                  <ArrowLeft size={17} />
                  {text.back}
                </button>
                <span className="text-sm text-white/38">
                  {Object.values(answers).filter(Boolean).length}/{steps.length}
                </span>
              </div>
            </section>

            <JamMatchBriefSummary
              answers={answers}
              steps={steps}
              activeStep={stepIndex}
              onEditStep={editStep}
              language={language}
            />
          </div>
        )}

        {dataState.message ? (
          <p className="mx-auto mt-5 max-w-3xl text-center text-xs text-white/34">
            {dataState.message}
          </p>
        ) : null}
      </section>
    </main>
  );
}
