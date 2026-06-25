import type { Creator, Listing, ListingCategory } from "@/lib/types";

export type JamMatchBudget = {
  min: number;
  max?: number;
};

export type JamMatchInput = {
  prompt: string;
  categoryIds: string[];
  budget: JamMatchBudget;
  deadlineId: string;
  language: "tr" | "en";
};

export type JamMatchResultKind = "artist" | "listing" | "service";

export type JamMatchResult = {
  kind: JamMatchResultKind;
  match: number;
  title: string;
  category: string;
  price: number;
  startsAt: boolean;
  rating: number;
  description: string;
  href: string;
  reasons: string[];
};

type ScoredListing = {
  listing: Listing;
  creator: Creator | null;
  score: number;
  searchHits: number;
  semanticHits: number;
  reasons: string[];
};

const categorySignals: Record<
  string,
  {
    categories: ListingCategory[];
    tokens: string[];
    label: Record<JamMatchInput["language"], string>;
  }
> = {
  beat: {
    categories: ["Beat", "Custom Production"],
    tokens: ["beat", "trap", "drill", "instrumental", "808", "prodüksiyon", "production"],
    label: { tr: "Beat", en: "Beat" }
  },
  vocal: {
    categories: ["Vocal Feature", "Songwriting"],
    tokens: ["vocal", "vokal", "hook", "topline", "female", "kadın", "armon", "demo"],
    label: { tr: "Vokal", en: "Vocal" }
  },
  mix: {
    categories: ["Mixing"],
    tokens: ["mix", "miks", "stem", "vocal chain", "low-end", "low end"],
    label: { tr: "Miks", en: "Mix" }
  },
  master: {
    categories: ["Mastering"],
    tokens: ["master", "mastering", "loudness", "spotify", "release", "yayın"],
    label: { tr: "Master", en: "Master" }
  },
  guitar: {
    categories: ["Guitar"],
    tokens: ["guitar", "gitar", "riff", "session", "di", "akustik", "electric"],
    label: { tr: "Gitar", en: "Guitar" }
  },
  lyrics: {
    categories: ["Lyrics", "Songwriting"],
    tokens: ["lyrics", "lyric", "söz", "şarkı sözü", "hook", "topline", "chorus"],
    label: { tr: "Söz", en: "Lyrics" }
  },
  jingle: {
    categories: ["Jingle"],
    tokens: ["jingle", "brand", "marka", "slogan", "podcast intro", "reklam"],
    label: { tr: "Jingle", en: "Jingle" }
  },
  "cover-art": {
    categories: ["Cover Art"],
    tokens: ["cover art", "kapak", "görsel", "artwork", "release kit", "tasarım"],
    label: { tr: "Kapak görseli", en: "Cover Art" }
  }
};

const promptSynonyms: Array<{
  label: Record<JamMatchInput["language"], string>;
  tokens: string[];
}> = [
  { label: { tr: "Karanlık duygu", en: "Dark mood" }, tokens: ["dark", "karanlık", "moody", "gece"] },
  { label: { tr: "Parlak duygu", en: "Bright mood" }, tokens: ["bright", "parlak", "sunny", "yaz"] },
  { label: { tr: "Kulüp enerjisi", en: "Club energy" }, tokens: ["club", "kulüp", "dance", "bounce"] },
  { label: { tr: "Sinematik his", en: "Cinematic feel" }, tokens: ["cinematic", "sinematik", "film"] },
  { label: { tr: "R&B/trap alanı", en: "R&B/trap lane" }, tokens: ["r&b", "rnb", "trap", "drill", "808"] },
  { label: { tr: "Pop alanı", en: "Pop lane" }, tokens: ["pop", "indie", "alt pop"] },
  { label: { tr: "Reklam/sync kullanımı", en: "Ad/sync use" }, tokens: ["ad", "reklam", "sync", "kampanya"] }
];

const ignoredWords = new Set([
  "bir",
  "ve",
  "ile",
  "için",
  "icin",
  "olan",
  "arıyorum",
  "istiyorum",
  "need",
  "with",
  "for",
  "the",
  "and",
  "around",
  "yaklaşık",
  "bütçe",
  "butce",
  "budget"
]);

export function findJamMatches(
  input: JamMatchInput,
  listings: Listing[],
  creators: Creator[]
): JamMatchResult[] {
  const prompt = normalizeText(input.prompt);
  const promptTokens = tokenize(prompt);
  const promptBudget = extractPromptBudget(prompt);
  const promptBpm = extractPromptBpm(prompt);
  const creatorMap = new Map(creators.map((creator) => [creator.id, creator]));
  const selectedSignals = input.categoryIds.flatMap((id) => categorySignals[id] ?? []);
  const scoredListings = listings
    .map((listing) =>
      scoreListing({
        listing,
        creator: creatorMap.get(listing.creatorId) ?? null,
        selectedSignals,
        prompt,
        promptTokens,
        promptBudget,
        promptBpm,
        budget: promptBudget ? { min: promptBudget, max: promptBudget } : input.budget,
        deadlineId: input.deadlineId,
        language: input.language
      })
    )
    .filter((item) => isUsefulMatch(item, promptTokens, selectedSignals.length));

  const listingMatches = scoredListings
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
  const creatorMatches = scoreCreators(scoredListings);
  const results = [
    ...creatorMatches.slice(0, 2).map(toArtistResult),
    ...listingMatches.map(toListingResult)
  ];

  return dedupeResults(results)
    .sort((a, b) => b.match - a.match)
    .slice(0, 3);
}

function scoreListing({
  listing,
  creator,
  selectedSignals,
  prompt,
  promptTokens,
  promptBudget,
  promptBpm,
  budget,
  deadlineId,
  language
}: {
  listing: Listing;
  creator: Creator | null;
  selectedSignals: Array<(typeof categorySignals)[string]>;
  prompt: string;
  promptTokens: string[];
  promptBudget: number | null;
  promptBpm: number | null;
  budget: JamMatchBudget;
  deadlineId: string;
  language: JamMatchInput["language"];
}): ScoredListing {
  const text = normalizeText(
    [
      listing.title,
      listing.category,
      listing.genre,
      listing.description,
      listing.licenseType,
      listing.turnaround,
      ...listing.tags,
      ...listing.moods,
      ...listing.useCases,
      ...listing.deliverables,
      creator?.name,
      creator?.headline,
      creator?.about,
      ...(creator?.specialties ?? []),
      ...(creator?.bestFor ?? [])
    ]
      .filter(Boolean)
      .join(" ")
  );
  const reasons: string[] = [];
  let score = 0;
  let searchHits = 0;
  let semanticHits = 0;

  for (const token of promptTokens) {
    if (text.includes(token)) {
      searchHits += 1;
      semanticHits += 1;
      score += token.length > 4 ? 7 : 4;
    }
  }

  for (const synonym of promptSynonyms) {
    if (synonym.tokens.some((token) => hasSignal(prompt, token))) {
      const matched = synonym.tokens.some((token) => hasSignal(text, token));
      if (matched) {
        semanticHits += 1;
        score += 9;
        reasons.push(synonym.label[language]);
      }
    }
  }

  for (const signal of selectedSignals) {
    const categoryMatch = signal.categories.includes(listing.category);
    const tokenMatch = signal.tokens.some((token) => hasSignal(text, token));
    if (categoryMatch || tokenMatch) {
      semanticHits += 1;
      score += categoryMatch ? 18 : 11;
      reasons.push(signal.label[language]);
    }
  }

  const categoryFromPrompt = Object.values(categorySignals).find((signal) =>
    signal.tokens.some((token) => hasSignal(prompt, token))
  );
  if (categoryFromPrompt) {
    const categoryMatch = categoryFromPrompt.categories.includes(listing.category);
    const tokenMatch = categoryFromPrompt.tokens.some((token) => hasSignal(text, token));
    if (categoryMatch || tokenMatch) {
      semanticHits += 1;
      score += categoryMatch ? 20 : 12;
      reasons.push(categoryFromPrompt.label[language]);
    }
  }

  const budgetScore = scoreBudget(listing.price, budget, language);
  score += budgetScore.score;
  if (budgetScore.reason) {
    reasons.push(budgetScore.reason);
  }
  if (promptBudget && listing.price > promptBudget * 1.65) {
    score -= 18;
  }

  const bpmScore = scoreBpm(listing.bpm, promptBpm, language);
  score += bpmScore.score;
  if (bpmScore.reason) {
    reasons.push(bpmScore.reason);
  }

  const deadlineScore = scoreDeadline(listing.deliverySpeed, deadlineId, language);
  score += deadlineScore.score;
  if (deadlineScore.reason) {
    reasons.push(deadlineScore.reason);
  }

  score += Math.min(listing.analytics.conversionRate, 12) * 0.7;
  score += creator?.verified ? 6 : 0;
  score += creator ? Math.min(creator.rating - 4.5, 0.5) * 16 : 0;

  return {
    listing,
    creator,
    score: clamp(score, 0, 100),
    searchHits,
    semanticHits,
    reasons: Array.from(new Set(reasons)).slice(0, 3)
  };
}

function scoreCreators(scoredListings: ScoredListing[]) {
  const grouped = new Map<string, ScoredListing[]>();
  for (const item of scoredListings) {
    if (!item.creator) continue;
    const current = grouped.get(item.creator.id) ?? [];
    current.push(item);
    grouped.set(item.creator.id, current);
  }

  return Array.from(grouped.values())
    .map((items) => {
      const best = items.sort((a, b) => b.score - a.score)[0];
      const creator = best.creator;
      if (!creator) return null;
      return {
        creator,
        listing: best.listing,
        score: clamp(best.score + Math.min(items.length * 3, 9), 0, 100),
        reasons: best.reasons
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((a, b) => b.score - a.score);
}

function toArtistResult(item: {
  creator: Creator;
  listing: Listing;
  score: number;
  reasons: string[];
}): JamMatchResult {
  return {
    kind: "artist",
    match: Math.round(item.score),
    title: item.creator.name,
    category: item.creator.specialties.slice(0, 2).join(" / ") || item.listing.category,
    price: item.listing.price,
    startsAt: true,
    rating: item.creator.rating,
    description: item.creator.headline,
    href: `/creators/${item.creator.handle}`,
    reasons: item.reasons
  };
}

function toListingResult(item: ScoredListing): JamMatchResult {
  const isService = item.listing.licenseType === "Service";
  return {
    kind: isService ? "service" : "listing",
    match: Math.round(item.score),
    title: item.listing.title,
    category: `${item.listing.category} / ${item.listing.genre}`,
    price: item.listing.price,
    startsAt: false,
    rating: item.creator?.rating ?? 4.8,
    description: item.listing.description,
    href: `/listing/${item.listing.id}`,
    reasons: item.reasons
  };
}

function isUsefulMatch(
  item: ScoredListing,
  promptTokens: string[],
  selectedSignalCount: number
) {
  if (item.score < 32) {
    return false;
  }

  if (promptTokens.length === 0) {
    return selectedSignalCount > 0;
  }

  return item.semanticHits > 0;
}

function scoreBudget(price: number, budget: JamMatchBudget, language: JamMatchInput["language"]) {
  const max = budget.max ?? Number.POSITIVE_INFINITY;
  if (price >= budget.min && price <= max) {
    return { score: 14, reason: language === "tr" ? "Bütçe uyumu" : "Budget fit" };
  }

  if (price < budget.min) {
    return { score: 7, reason: language === "tr" ? "Bütçe altında" : "Below budget" };
  }

  if (Number.isFinite(max) && price <= max * 1.25) {
    return { score: 5, reason: language === "tr" ? "Bütçeye yakın" : "Near budget" };
  }

  return { score: -8, reason: "" };
}

function scoreBpm(
  listingBpm: number | null,
  promptBpm: number | null,
  language: JamMatchInput["language"]
) {
  if (!promptBpm || !listingBpm) {
    return { score: 0, reason: "" };
  }

  const difference = Math.abs(listingBpm - promptBpm);
  if (difference <= 3) {
    return { score: 13, reason: language === "tr" ? "BPM uyumu" : "BPM fit" };
  }
  if (difference <= 10) {
    return { score: 6, reason: language === "tr" ? "BPM yakın" : "Close BPM" };
  }
  return { score: -8, reason: "" };
}

function scoreDeadline(
  deliverySpeed: Listing["deliverySpeed"],
  deadlineId: string,
  language: JamMatchInput["language"]
) {
  if (deadlineId === "flexible") {
    return { score: 2, reason: "" };
  }
  if (deadlineId === "24h") {
    return deliverySpeed === "instant"
      ? { score: 12, reason: language === "tr" ? "Hızlı teslim" : "Fast delivery" }
      : { score: -10, reason: "" };
  }
  if (deadlineId === "3-days") {
    return deliverySpeed === "instant" || deliverySpeed === "fast"
      ? { score: 9, reason: language === "tr" ? "Teslim süresi uygun" : "Deadline fit" }
      : { score: -4, reason: "" };
  }
  return { score: 5, reason: language === "tr" ? "Teslim süresi uygun" : "Deadline fit" };
}

function extractPromptBudget(prompt: string) {
  const currencyMatch = prompt.match(/(?:\$|usd|dolar|dollar)\s*(\d{2,5})|(\d{2,5})\s*(?:\$|usd|dolar|dollar)/);
  if (currencyMatch) {
    const value = Number(currencyMatch[1] ?? currencyMatch[2]);
    return Number.isFinite(value) ? value : null;
  }

  const budgetMatch = prompt.match(/(?:budget|bütçe|butce|around|yaklaşık|civarı)\D{0,16}(\d{2,5})/);
  if (!budgetMatch) {
    return null;
  }

  const value = Number(budgetMatch[1]);
  return Number.isFinite(value) ? value : null;
}

function extractPromptBpm(prompt: string) {
  const match = prompt.match(/(\d{2,3})\s*bpm/);
  if (!match) {
    return null;
  }

  const value = Number(match[1]);
  return value >= 40 && value <= 240 ? value : null;
}

function dedupeResults(results: JamMatchResult[]) {
  const seen = new Set<string>();
  return results.filter((result) => {
    const key = `${result.kind}-${result.href}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function tokenize(text: string) {
  return Array.from(
    new Set(
      text
        .split(/[^a-z0-9ğüşıöç&]+/i)
        .map((token) => token.trim())
        .filter((token) => token.length > 2 && !ignoredWords.has(token))
    )
  ).slice(0, 18);
}

function normalizeText(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

function hasSignal(text: string, token: string) {
  const normalizedToken = normalizeText(token);
  if (!normalizedToken) {
    return false;
  }

  if (normalizedToken.length <= 3 && !normalizedToken.includes(" ")) {
    return tokenizeForExactSignals(text).includes(normalizedToken);
  }

  return text.includes(normalizedToken);
}

function tokenizeForExactSignals(text: string) {
  return text
    .split(/[^a-z0-9ğüşıöç&]+/i)
    .map((token) => token.trim())
    .filter(Boolean);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
