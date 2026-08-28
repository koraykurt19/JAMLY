export type SandboxCardBrand = "visa" | "mastercard" | "amex" | "test";

export type SandboxCardError =
  | "missing_payment_method"
  | "unsupported_payment_method"
  | "unsupported_test_card"
  | "invalid_card_number"
  | "invalid_expiry"
  | "expired_card"
  | "invalid_cvc"
  | "invalid_cardholder"
  | "declined_card";

export type SandboxCardDetails = {
  brand: SandboxCardBrand;
  last4: string;
  expMonth: number;
  expYear: number;
  holder: string;
};

const SANDBOX_TEST_CARDS = new Map<
  string,
  { brand: SandboxCardBrand; outcome: "approved" | "declined" }
>([
  ["4242424242424242", { brand: "visa", outcome: "approved" }],
  ["5555555555554444", { brand: "mastercard", outcome: "approved" }],
  ["4000056655665556", { brand: "visa", outcome: "approved" }],
  ["4000000000000002", { brand: "visa", outcome: "declined" }]
]);

export function formatSandboxCardInput(value: string) {
  return normalizeSandboxCardNumber(value)
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ")
    .trim();
}

export function formatSandboxExpiryInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function formatSandboxCardPreview(value: string) {
  const digits = normalizeSandboxCardNumber(value).padEnd(16, "*");
  return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)} ${digits.slice(12, 16)}`;
}

export function normalizeSandboxCardNumber(value: string) {
  return value.replace(/\D/g, "");
}

export function detectSandboxCardBrand(value: string): SandboxCardBrand {
  const digits = normalizeSandboxCardNumber(value);
  if (/^4/.test(digits)) return "visa";
  if (/^5[1-5]/.test(digits)) return "mastercard";
  if (/^3[47]/.test(digits)) return "amex";
  return "test";
}

export function validateSandboxPaymentMethod(value: unknown):
  | { ok: true; card: SandboxCardDetails }
  | { ok: false; error: SandboxCardError } {
  if (!value || typeof value !== "object") {
    return { ok: false, error: "missing_payment_method" };
  }

  const method = value as { type?: unknown; card?: unknown };
  if (method.type !== "card" || !method.card || typeof method.card !== "object") {
    return { ok: false, error: "unsupported_payment_method" };
  }

  const card = method.card as {
    number?: unknown;
    expiry?: unknown;
    cvc?: unknown;
    name?: unknown;
  };
  const number = typeof card.number === "string" ? normalizeSandboxCardNumber(card.number) : "";
  const expiry = typeof card.expiry === "string" ? card.expiry.trim() : "";
  const cvc = typeof card.cvc === "string" ? card.cvc.replace(/\D/g, "") : "";
  const name = typeof card.name === "string" ? normalizeSandboxCardholder(card.name) : "";

  if (!isValidLuhn(number)) {
    return { ok: false, error: "invalid_card_number" };
  }

  const testCard = SANDBOX_TEST_CARDS.get(number);
  if (!testCard) {
    return { ok: false, error: "unsupported_test_card" };
  }
  if (testCard.outcome === "declined") {
    return { ok: false, error: "declined_card" };
  }

  const parsedExpiry = parseSandboxExpiry(expiry);
  if (!parsedExpiry) {
    return { ok: false, error: "invalid_expiry" };
  }
  if (isExpired(parsedExpiry.month, parsedExpiry.year)) {
    return { ok: false, error: "expired_card" };
  }

  if (!/^\d{3,4}$/.test(cvc)) {
    return { ok: false, error: "invalid_cvc" };
  }
  if (name.length < 2 || name.length > 48) {
    return { ok: false, error: "invalid_cardholder" };
  }

  return {
    ok: true,
    card: {
      brand: testCard.brand,
      last4: number.slice(-4),
      expMonth: parsedExpiry.month,
      expYear: parsedExpiry.year,
      holder: name
    }
  };
}

function normalizeSandboxCardholder(value: string) {
  return value
    .replace(/[^\p{L}\p{N} .'-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function parseSandboxExpiry(value: string) {
  const match = /^(\d{2})\/(\d{2})$/.exec(value);
  if (!match) return null;

  const month = Number(match[1]);
  if (month < 1 || month > 12) return null;

  return { month, year: 2000 + Number(match[2]) };
}

function isExpired(month: number, year: number) {
  const now = new Date();
  const currentMonth = now.getUTCMonth() + 1;
  const currentYear = now.getUTCFullYear();
  return year < currentYear || (year === currentYear && month < currentMonth);
}

function isValidLuhn(value: string) {
  if (!/^\d{12,19}$/.test(value)) return false;

  let sum = 0;
  let doubleDigit = false;
  for (let index = value.length - 1; index >= 0; index -= 1) {
    let digit = Number(value[index]);
    if (doubleDigit) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    doubleDigit = !doubleDigit;
  }

  return sum % 10 === 0;
}
