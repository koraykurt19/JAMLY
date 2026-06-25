"use client";

import { ChevronDown, Coins, Languages } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { languageNames, type Language } from "@/lib/i18n";
import type { DisplayCurrency } from "@/lib/format";
import { useI18n } from "@/components/language-provider";

const languages: Language[] = ["tr", "en"];
const currencies: DisplayCurrency[] = ["USD", "TRY"];

type OpenMenu = "language" | "currency" | null;

export function LanguageToggle() {
  const {
    language,
    setLanguage,
    currencyCode,
    setCurrencyCode,
    t
  } = useI18n();
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
    };
  }, []);

  return (
    <div ref={containerRef} className="flex items-center gap-2">
      <PreferenceDropdown
        icon={<Languages size={15} />}
        label={t("language")}
        value={languageNames[language]}
        shortValue={language.toUpperCase()}
        open={openMenu === "language"}
        onToggle={() => setOpenMenu(openMenu === "language" ? null : "language")}
      >
        {languages.map((item) => (
          <MenuButton
            key={item}
            active={language === item}
            label={languageNames[item]}
            value={item.toUpperCase()}
            onClick={() => {
              setLanguage(item);
              setOpenMenu(null);
            }}
          />
        ))}
      </PreferenceDropdown>

      <PreferenceDropdown
        icon={<Coins size={15} />}
        label={t("currency")}
        value={currencyCode === "USD" ? t("currencyUsd") : t("currencyTry")}
        shortValue={currencyCode}
        open={openMenu === "currency"}
        onToggle={() => setOpenMenu(openMenu === "currency" ? null : "currency")}
      >
        {currencies.map((item) => (
          <MenuButton
            key={item}
            active={currencyCode === item}
            label={item === "USD" ? t("currencyUsd") : t("currencyTry")}
            value={item}
            onClick={() => {
              setCurrencyCode(item);
              setOpenMenu(null);
            }}
          />
        ))}
      </PreferenceDropdown>
    </div>
  );
}

function PreferenceDropdown({
  icon,
  label,
  value,
  shortValue,
  open,
  onToggle,
  children
}: {
  icon: ReactNode;
  label: string;
  value: string;
  shortValue: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="focus-ring inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3 text-xs font-bold uppercase text-white/76 transition hover:border-white/20 hover:bg-white/8 hover:text-white"
        aria-label={label}
        aria-expanded={open}
      >
        <span className="text-white/48">{icon}</span>
        <span>{shortValue}</span>
        <ChevronDown
          size={14}
          className={`text-white/42 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-50 min-w-44 overflow-hidden rounded-lg border border-white/10 bg-jam-panel/95 p-1 shadow-soft backdrop-blur-xl">
          <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/38">
            {label}
          </p>
          {children}
          <p className="sr-only">{value}</p>
        </div>
      ) : null}
    </div>
  );
}

function MenuButton({
  active,
  label,
  value,
  onClick
}: {
  active: boolean;
  label: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`focus-ring flex w-full items-center justify-between gap-4 rounded-md px-3 py-2 text-left text-sm transition ${
        active
          ? "bg-jam-mint text-black"
          : "text-white/66 hover:bg-white/8 hover:text-white"
      }`}
    >
      <span>{label}</span>
      <span className="text-xs font-bold uppercase opacity-70">{value}</span>
    </button>
  );
}
