"use client";

import { ClipboardList, WandSparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { useI18n } from "@/components/language-provider";
import { currency } from "@/lib/format";

export function CreativeBriefBuilder() {
  const { currencyCode, language, t, usdTryRate } = useI18n();
  const [project, setProject] = useState("");
  const [mood, setMood] = useState("");
  const [useCase, setUseCase] = useState("");
  const [reference, setReference] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");

  const brief = useMemo(() => {
    const fallback = language === "tr" ? "Belirtilmedi" : "Not specified";
    const budgetValue = Number(budget);
    const formattedBudget =
      budget && Number.isFinite(budgetValue)
        ? currency(budgetValue, language, currencyCode, usdTryRate)
        : fallback;

    if (language === "tr") {
      return `Proje: ${project || fallback}. Duygu: ${mood || fallback}. Kullanım amacı: ${
        useCase || fallback
      }. Referans: ${
        reference || fallback
      }. Tahmini bütçe: ${formattedBudget}. Teslim hedefi: ${deadline || fallback}.`;
    }

    return `Project: ${project || fallback}. Mood: ${mood || fallback}. Use case: ${
      useCase || fallback
    }. Reference: ${
      reference || fallback
    }. Budget intent: ${formattedBudget}. Delivery target: ${deadline || fallback}.`;
  }, [budget, currencyCode, deadline, language, mood, project, reference, useCase, usdTryRate]);

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-jam-mint">
            {t("briefBuilderTitle")}
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">
            {t("briefBuilderCopy")}
          </h2>
        </div>
        <ClipboardList size={22} className="shrink-0 text-jam-blue" />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <BriefInput label={t("briefProject")} value={project} onChange={setProject} placeholder={t("briefProjectPlaceholder")} />
        <BriefInput label={t("briefMood")} value={mood} onChange={setMood} placeholder={t("briefMoodPlaceholder")} />
        <BriefInput label={t("briefUseCase")} value={useCase} onChange={setUseCase} placeholder={t("briefUseCasePlaceholder")} />
        <BriefInput label={t("briefReference")} value={reference} onChange={setReference} placeholder={t("briefReferencePlaceholder")} />
        <div className="grid grid-cols-2 gap-3">
          <BriefInput label={t("briefBudget")} value={budget} onChange={setBudget} placeholder={t("briefBudgetPlaceholder")} />
          <BriefInput label={t("briefDeadline")} value={deadline} onChange={setDeadline} placeholder={t("briefDeadlinePlaceholder")} />
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-jam-mint/25 bg-jam-mint/10 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-jam-mint">
          <WandSparkles size={16} />
          {t("briefPreviewTitle")}
        </div>
        <p className="mt-3 text-sm leading-6 text-white/70">{brief}</p>
      </div>
    </div>
  );
}

function BriefInput({
  label,
  value,
  onChange,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/42">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="input-field h-11 text-sm"
      />
    </label>
  );
}
