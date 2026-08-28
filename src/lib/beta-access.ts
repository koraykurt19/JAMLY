export const defaultBetaAllowedHandles = [
  "koraykurt",
  "hakanefe",
  "jamlybuyer",
  "jamlycreator"
] as const;

export function betaAllowedHandleSet(value: string | undefined, fallback = defaultBetaAllowedHandles) {
  return new Set(
    (value?.split(",") ?? fallback)
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isHandleBetaAllowed(handle: string | null | undefined, value?: string) {
  return betaAllowedHandleSet(value).has(String(handle ?? "").trim().toLowerCase());
}
