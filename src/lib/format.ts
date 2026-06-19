import { clsx, type ClassValue } from "clsx";
import type { Language } from "@/lib/i18n";

export type DisplayCurrency = "USD" | "TRY";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function currency(
  value: number,
  language: Language = "tr",
  displayCurrency: DisplayCurrency = "USD",
  usdTryRate = 1
) {
  const amount = displayCurrency === "TRY" ? value * usdTryRate : value;
  const locale = displayCurrency === "TRY" ? "tr-TR" : language === "tr" ? "tr-TR" : "en-US";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: displayCurrency,
    maximumFractionDigits: 0
  }).format(amount);
}

export function shortDate(value: string, language: Language = "tr") {
  return new Intl.DateTimeFormat(language === "tr" ? "tr-TR" : "en-US", {
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}
