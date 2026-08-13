/**
 * Money handling.
 *
 * Amounts crossing a boundary (database, provider, receipt) are integer minor
 * units — 24.99 USD is 2499. Floats are only ever used for display formatting,
 * never for arithmetic, because 0.1 + 0.2 !== 0.3 and a marketplace cannot
 * afford that in a payout.
 */

export type Currency = "USD" | "TRY";

export const currencies: Currency[] = ["USD", "TRY"];

/** Minor-unit exponent. Both supported currencies use 2 decimal places. */
const MINOR_UNIT_EXPONENT: Record<Currency, number> = {
  USD: 2,
  TRY: 2
};

export function toMinorUnits(amount: number, currency: Currency = "USD") {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Amount must be a non-negative finite number");
  }
  const factor = 10 ** MINOR_UNIT_EXPONENT[currency];

  // Scaling alone is not enough: 1.005 * 100 is 100.49999999999999 in IEEE754,
  // so both Math.round and toFixed(0) would yield 100 and quietly lose a cent.
  // Collapsing to 15 significant digits first discards the representation
  // error while preserving every digit that can be meaningful here.
  const scaled = Number((amount * factor).toPrecision(15));
  return Math.round(scaled);
}

export function fromMinorUnits(minor: number, currency: Currency = "USD") {
  const factor = 10 ** MINOR_UNIT_EXPONENT[currency];
  return minor / factor;
}

export function formatMinor(minor: number, currency: Currency, locale: "tr" | "en") {
  return new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: MINOR_UNIT_EXPONENT[currency],
    maximumFractionDigits: MINOR_UNIT_EXPONENT[currency]
  }).format(fromMinorUnits(minor, currency));
}

/**
 * Splits an amount by percentage with deterministic remainder handling.
 *
 * Naive per-recipient rounding loses or invents cents. This allocates the
 * floor to everyone, then distributes the leftover one minor unit at a time to
 * the largest fractional parts, so the parts always sum back to the total.
 */
export function allocateByPercentage(
  totalMinor: number,
  shares: { id: string; percent: number }[]
): { id: string; amountMinor: number }[] {
  if (shares.length === 0) return [];

  const totalPercent = shares.reduce((sum, share) => sum + share.percent, 0);
  if (totalPercent <= 0) return shares.map((share) => ({ id: share.id, amountMinor: 0 }));

  const exact = shares.map((share) => ({
    id: share.id,
    raw: (totalMinor * share.percent) / totalPercent
  }));

  const allocated = exact.map((entry) => ({
    id: entry.id,
    amountMinor: Math.floor(entry.raw),
    remainder: entry.raw - Math.floor(entry.raw)
  }));

  let distributed = allocated.reduce((sum, entry) => sum + entry.amountMinor, 0);
  let leftover = totalMinor - distributed;

  const byRemainder = [...allocated].sort((a, b) => b.remainder - a.remainder);
  let index = 0;
  while (leftover > 0 && byRemainder.length > 0) {
    byRemainder[index % byRemainder.length].amountMinor += 1;
    leftover -= 1;
    index += 1;
  }

  distributed = allocated.reduce((sum, entry) => sum + entry.amountMinor, 0);
  if (distributed !== totalMinor) {
    throw new Error(`Split does not reconcile: ${distributed} !== ${totalMinor}`);
  }

  return allocated.map(({ id, amountMinor }) => ({ id, amountMinor }));
}

/** Platform commission, mirrored from `calculate_platform_fee` in the database. */
export function calculatePlatformFee(
  amountMinor: number,
  config: { percent: number; minimumMinor: number } = { percent: 10, minimumMinor: 100 }
) {
  const fee = Math.floor((amountMinor * config.percent + 50) / 100);
  return Math.max(fee, config.minimumMinor);
}
