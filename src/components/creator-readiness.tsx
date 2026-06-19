"use client";

import { CheckCircle2, CircleDashed, KanbanSquare, TrendingUp } from "lucide-react";
import { splitMessageList } from "@/lib/i18n";
import { useI18n } from "@/components/language-provider";

export function CreatorReadiness() {
  const { t } = useI18n();
  const items = splitMessageList(t("readinessItems"));
  const deliveryItems = splitMessageList(t("deliveryBoardItems"));

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-jam-mint">
              {t("readinessTitle")}
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">
              {t("readinessCopy")}
            </h2>
          </div>
          <TrendingUp size={21} className="shrink-0 text-jam-blue" />
        </div>

        <div className="mt-5 rounded-lg border border-white/10 bg-black/24 p-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm text-white/48">{t("readinessScore")}</p>
              <p className="mt-1 text-4xl font-semibold tracking-tight text-white">82%</p>
            </div>
            <div className="h-2 w-36 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[82%] rounded-full bg-jam-mint" />
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          {items.map((item, index) => {
            const done = index < 4;
            const Icon = done ? CheckCircle2 : CircleDashed;
            return (
              <div
                key={item}
                className="flex items-center justify-between rounded-md bg-black/24 px-3 py-2 text-sm"
              >
                <span className="inline-flex items-center gap-2 text-white/68">
                  <Icon size={16} className={done ? "text-jam-mint" : "text-jam-gold"} />
                  {item}
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/36">
                  {done ? t("readinessComplete") : t("readinessPending")}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
        <div className="flex items-start gap-3">
          <KanbanSquare size={21} className="mt-1 text-jam-gold" />
          <div>
            <h2 className="text-xl font-semibold text-white">{t("deliveryBoardTitle")}</h2>
            <p className="mt-2 text-sm leading-6 text-white/56">{t("deliveryBoardCopy")}</p>
          </div>
        </div>
        <div className="mt-4 grid gap-2">
          {deliveryItems.map((item, index) => (
            <div key={item} className="rounded-md border border-white/10 bg-black/24 p-3">
              <p className="text-sm font-semibold text-white">{item}</p>
              <p className="mt-1 text-xs text-white/42">
                {index === 0 ? "2" : index === 1 ? "1" : "3"} {t("openRequests").toLowerCase()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
