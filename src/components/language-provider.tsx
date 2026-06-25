"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { getMessage, type Language, type MessageKey } from "@/lib/i18n";
import type { DisplayCurrency } from "@/lib/format";

const FALLBACK_USD_TRY_RATE = 40;

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  currencyCode: DisplayCurrency;
  setCurrencyCode: (currencyCode: DisplayCurrency) => void;
  usdTryRate: number;
  t: (key: MessageKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("tr");
  const [currencyCode, setCurrencyCodeState] = useState<DisplayCurrency>("USD");
  const [usdTryRate, setUsdTryRate] = useState(FALLBACK_USD_TRY_RATE);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("jamly-language");
    if (saved === "tr" || saved === "en") {
      setLanguageState(saved);
    }

    const savedCurrency = window.localStorage.getItem("jamly-currency");
    if (savedCurrency === "USD" || savedCurrency === "TRY") {
      setCurrencyCodeState(savedCurrency);
    }

    setPreferencesLoaded(true);
  }, []);

  useEffect(() => {
    if (!preferencesLoaded) {
      return;
    }

    document.documentElement.lang = language;
    window.localStorage.setItem("jamly-language", language);
  }, [language, preferencesLoaded]);

  useEffect(() => {
    if (!preferencesLoaded) {
      return;
    }

    window.localStorage.setItem("jamly-currency", currencyCode);
  }, [currencyCode, preferencesLoaded]);

  useEffect(() => {
    let active = true;

    async function loadExchangeRate() {
      try {
        const response = await fetch("/api/exchange-rate", { cache: "no-store" });
        const data = (await response.json()) as { rate?: number };

        if (active && typeof data.rate === "number" && Number.isFinite(data.rate)) {
          setUsdTryRate(data.rate);
        }
      } catch {
        if (active) {
          setUsdTryRate(FALLBACK_USD_TRY_RATE);
        }
      }
    }

    loadExchangeRate();

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage: setLanguageState,
      currencyCode,
      setCurrencyCode: setCurrencyCodeState,
      usdTryRate,
      t: (key) => getMessage(language, key)
    }),
    [currencyCode, language, usdTryRate]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useI18n must be used inside LanguageProvider");
  }

  return context;
}
