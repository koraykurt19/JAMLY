import { NextResponse } from "next/server";

const GOOGLE_FINANCE_URL =
  "https://www.google.com/finance/quote/USD-TRY?hl=en";
const FALLBACK_USD_TRY_RATE = 40;

export const dynamic = "force-dynamic";

export async function GET() {
  const controller = new AbortController();
  const timeout = windowlessTimeout(() => controller.abort(), 2500);

  try {
    const response = await fetch(GOOGLE_FINANCE_URL, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36"
      }
    });

    if (!response.ok) {
      throw new Error(`Google Finance responded with ${response.status}`);
    }

    const html = await response.text();
    const rate = parseGoogleFinanceRate(html);

    if (!rate) {
      throw new Error("Could not parse USD/TRY rate");
    }

    return NextResponse.json({
      base: "USD",
      quote: "TRY",
      rate,
      source: "google-finance",
      fetchedAt: new Date().toISOString()
    });
  } catch {
    return NextResponse.json({
      base: "USD",
      quote: "TRY",
      rate: FALLBACK_USD_TRY_RATE,
      source: "fallback",
      fetchedAt: new Date().toISOString()
    });
  } finally {
    clearTimeout(timeout);
  }
}

function windowlessTimeout(callback: () => void, delay: number) {
  return setTimeout(callback, delay);
}

function parseGoogleFinanceRate(html: string) {
  const candidates = [
    /data-last-price="([0-9.,]+)"/,
    /class="YMlKec fxKbKc">([^<]+)</
  ];

  for (const pattern of candidates) {
    const match = html.match(pattern);
    const rawValue = match?.[1]?.replace(/,/g, "").trim();
    const rate = rawValue ? Number(rawValue) : 0;

    if (Number.isFinite(rate) && rate > 0) {
      return rate;
    }
  }

  return null;
}
