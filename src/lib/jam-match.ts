import type { Creator, Listing, ListingCategory } from "@/lib/types";

export type JamMatchBudget = {
  min: number;
  max?: number;
};

export type JamMatchWorkType = "ready" | "custom";

export type JamMatchInput = {
  prompt: string;
  categoryIds: string[];
  genreId?: string;
  budget: JamMatchBudget;
  deadlineId: string;
  workType?: JamMatchWorkType;
  language: "tr" | "en";
};

export type JamMatchResultKind = "artist" | "listing" | "service";

export type JamMatchResult = {
  kind: JamMatchResultKind;
  match: number;
  artistId: string;
  listingId: string;
  artistName: string;
  artistAvatarUrl: string;
  listingTitle: string;
  coverImageUrl: string;
  category: string;
  genre: string;
  price: number;
  startsAt: boolean;
  rating: number;
  deliveryTime: string;
  description: string;
  artistHref: string;
  listingHref: string;
  reasons: string[];
};

type MatchSignal = {
  categories: ListingCategory[];
  tokens: string[];
  label: Record<JamMatchInput["language"], string>;
};

type GenreSignal = {
  tokens: string[];
  label: Record<JamMatchInput["language"], string>;
};

type ScoredListing = {
  listing: Listing;
  creator: Creator | null;
  score: number;
  searchHits: number;
  semanticHits: number;
  categoryMatch: boolean;
  genreMatch: boolean;
  budgetMatch: boolean;
  deadlineMatch: boolean;
  workTypeMatch: boolean;
  reasons: string[];
};

const categorySignals: Record<string, MatchSignal> = {
  beat: {
    categories: ["Beat"],
    tokens: ["beat", "instrumental", "808"],
    label: { tr: "Beat ihtiyacı", en: "Beat fit" }
  },
  vocal: {
    categories: ["Vocal Feature"],
    tokens: ["vocal", "vokal", "singer", "şarkıcı", "harmon", "armon"],
    label: { tr: "Vokal ihtiyacı", en: "Vocal fit" }
  },
  lyrics: {
    categories: ["Lyrics", "Songwriting"],
    tokens: ["lyrics", "lyric", "söz", "hook", "topline", "chorus"],
    label: { tr: "Söz yazımı", en: "Lyrics fit" }
  },
  "mixing-mastering": {
    categories: ["Mixing", "Mastering"],
    tokens: ["mix", "miks", "master", "mastering", "loudness", "stem"],
    label: { tr: "Miks/master", en: "Mix/master fit" }
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
  "guitar-riff": {
    categories: ["Guitar"],
    tokens: ["guitar", "gitar", "riff", "session", "akustik", "electric"],
    label: { tr: "Enstrüman/riff", en: "Instrument riff" }
  },
  guitar: {
    categories: ["Guitar"],
    tokens: ["guitar", "gitar", "riff", "session", "akustik", "electric"],
    label: { tr: "Gitar", en: "Guitar" }
  },
  jingle: {
    categories: ["Jingle"],
    tokens: ["jingle", "brand", "marka", "slogan", "podcast intro", "reklam"],
    label: { tr: "Jingle", en: "Jingle" }
  },
  "sample-pack": {
    categories: ["Beat"],
    tokens: ["sample pack", "sample", "paket", "pack", "loop", "one-shot", "oneshot"],
    label: { tr: "Sample paketi", en: "Sample pack" }
  },
  "custom-producer": {
    categories: ["Custom Production"],
    tokens: ["custom production", "custom producer", "özel prodüksiyon", "prodüksiyon", "producer"],
    label: { tr: "Özel prodüksiyon", en: "Custom production" }
  },
  "cover-art": {
    categories: ["Cover Art"],
    tokens: ["cover art", "kapak", "görsel", "artwork", "release kit", "tasarım"],
    label: { tr: "Kapak görseli", en: "Cover art" }
  }
};

const genreSignals: Record<string, GenreSignal> = {
  "hip-hop": {
    tokens: ["hip-hop", "hip hop", "hiphop", "rap"],
    label: { tr: "Hip-Hop türü", en: "Hip-Hop genre" }
  },
  trap: {
    tokens: ["trap", "trap soul", "808"],
    label: { tr: "Trap türü", en: "Trap genre" }
  },
  drill: {
    tokens: ["drill"],
    label: { tr: "Drill türü", en: "Drill genre" }
  },
  "r-and-b": {
    tokens: ["r&b", "rnb", "rhythm and blues", "trap soul"],
    label: { tr: "R&B türü", en: "R&B genre" }
  },
  pop: {
    tokens: ["pop", "indie pop", "pop/r&b"],
    label: { tr: "Pop türü", en: "Pop genre" }
  },
  afrobeat: {
    tokens: ["afrobeat", "afrobeats", "afro"],
    label: { tr: "Afrobeat türü", en: "Afrobeat genre" }
  },
  rock: {
    tokens: ["rock", "alternative rock", "indie rock"],
    label: { tr: "Rock türü", en: "Rock genre" }
  },
  electronic: {
    tokens: ["electronic", "elektronik", "edm", "house", "techno"],
    label: { tr: "Elektronik türü", en: "Electronic genre" }
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
  const selectedSignals = input.categoryIds
    .map((id) => categorySignals[id])
    .filter((signal): signal is MatchSignal => Boolean(signal));
  const selectedGenre = input.genreId ? genreSignals[input.genreId] : undefined;
  const scoredListings = listings
    .map((listing) =>
      scoreListing({
        listing,
        creator: creatorMap.get(listing.creatorId) ?? null,
        selectedSignals,
        selectedGenre,
        prompt,
        promptTokens,
        promptBudget,
        promptBpm,
        budget: promptBudget ? { min: 0, max: promptBudget } : input.budget,
        deadlineId: input.deadlineId,
        workType: input.workType,
        language: input.language
      })
    )
    .filter((item) => isUsefulMatch(item, input, promptTokens));

  const listingMatches = scoredListings.sort((a, b) => b.score - a.score).slice(0, 6);
  const creatorMatches = scoreCreators(scoredListings);
  const results = [
    ...creatorMatches.slice(0, 2).map(toArtistResult),
    ...listingMatches.map(toListingResult)
  ];

  return dedupeResults(results)
    .sort((a, b) => b.match - a.match)
    .slice(0, 6);
}

function scoreListing({
  listing,
  creator,
  selectedSignals,
  selectedGenre,
  prompt,
  promptTokens,
  promptBudget,
  promptBpm,
  budget,
  deadlineId,
  workType,
  language
}: {
  listing: Listing;
  creator: Creator | null;
  selectedSignals: MatchSignal[];
  selectedGenre?: GenreSignal;
  prompt: string;
  promptTokens: string[];
  promptBudget: number | null;
  promptBpm: number | null;
  budget: JamMatchBudget;
  deadlineId: string;
  workType?: JamMatchWorkType;
  language: JamMatchInput["language"];
}): ScoredListing {
  const listingText = normalizeText(
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
      ...listing.deliverables
    ].join(" ")
  );
  const text = normalizeText(
    [
      listingText,
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
    if (hasSignal(text, token)) {
      searchHits += 1;
      semanticHits += 1;
      score += token.length > 4 ? 7 : 4;
    }
  }

  for (const synonym of promptSynonyms) {
    if (
      synonym.tokens.some((token) => hasSignal(prompt, token)) &&
      synonym.tokens.some((token) => hasSignal(text, token))
    ) {
      semanticHits += 1;
      score += 9;
      reasons.push(synonym.label[language]);
    }
  }

  const categoryMatch =
    selectedSignals.length === 0 ||
    selectedSignals.some(
      (signal) =>
        signal.categories.includes(listing.category) ||
        signal.tokens.some((token) => hasSignal(listingText, token))
    );
  if (categoryMatch && selectedSignals.length > 0) {
    semanticHits += 1;
    score += 28;
    const matchedSignal = selectedSignals.find(
      (signal) =>
        signal.categories.includes(listing.category) ||
        signal.tokens.some((token) => hasSignal(listingText, token))
    );
    if (matchedSignal) reasons.push(matchedSignal.label[language]);
  }

  const acceptsAnyGenre = ["her tür", "her tur", "any genre", "all genres"].some((token) =>
    hasSignal(listingText, token)
  );
  const genreMatch =
    !selectedGenre ||
    acceptsAnyGenre ||
    selectedGenre.tokens.some((token) => hasSignal(listingText, token));
  if (genreMatch && selectedGenre) {
    semanticHits += 1;
    score += 22;
    reasons.push(selectedGenre.label[language]);
  }

  const budgetScore = scoreBudget(listing.price, budget, language);
  score += budgetScore.score;
  if (budgetScore.reason) reasons.push(budgetScore.reason);
  const budgetMatch = isWithinBudget(listing.price, budget);
  if (promptBudget && listing.price > promptBudget) score -= 20;

  const bpmScore = scoreBpm(listing.bpm, promptBpm, language);
  score += bpmScore.score;
  if (bpmScore.reason) reasons.push(bpmScore.reason);

  const deadlineScore = scoreDeadline(listing.deliverySpeed, deadlineId, language);
  score += deadlineScore.score;
  if (deadlineScore.reason) reasons.push(deadlineScore.reason);
  const deadlineMatch = isWithinDeadline(listing.deliverySpeed, deadlineId);

  const workTypeMatch = matchesWorkType(listing, workType);
  if (workTypeMatch && workType) {
    score += 12;
    reasons.push(
      workType === "ready"
        ? language === "tr"
          ? "Hazır ürün"
          : "Ready-made"
        : language === "tr"
          ? "Özel çalışma"
          : "Custom work"
    );
  }

  score += Math.min(listing.analytics.conversionRate, 12) * 0.7;
  score += creator?.verified ? 6 : 0;
  score += creator ? Math.max(Math.min(creator.rating - 4.5, 0.5), 0) * 16 : 0;

  return {
    listing,
    creator,
    score: clamp(score, 0, 100),
    searchHits,
    semanticHits,
    categoryMatch,
    genreMatch,
    budgetMatch,
    deadlineMatch,
    workTypeMatch,
    reasons: Array.from(new Set(reasons)).slice(0, 4)
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
      const best = [...items].sort((a, b) => b.score - a.score)[0];
      const creator = best.creator;
      if (!creator) return null;
      return {
        creator,
        listing: best.listing,
        score: clamp(best.score + Math.min(items.length * 2, 6), 0, 100),
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
    artistId: item.creator.id,
    listingId: item.listing.id,
    artistName: item.creator.name,
    artistAvatarUrl: item.creator.avatarUrl,
    listingTitle: item.listing.title,
    coverImageUrl: item.listing.coverImageUrl,
    category: item.listing.category,
    genre: item.listing.genre,
    price: item.listing.price,
    startsAt: true,
    rating: item.creator.rating,
    deliveryTime: item.listing.turnaround,
    description: item.creator.headline,
    artistHref: `/creators/${item.creator.handle}`,
    listingHref: `/listing/${item.listing.id}`,
    reasons: item.reasons
  };
}

function toListingResult(item: ScoredListing): JamMatchResult {
  const isService = item.listing.licenseType === "Service";
  return {
    kind: isService ? "service" : "listing",
    match: Math.round(item.score),
    artistId: item.listing.creatorId,
    listingId: item.listing.id,
    artistName: item.creator?.name ?? item.listing.creatorName,
    artistAvatarUrl: item.creator?.avatarUrl ?? item.listing.creatorAvatarUrl,
    listingTitle: item.listing.title,
    coverImageUrl: item.listing.coverImageUrl,
    category: item.listing.category,
    genre: item.listing.genre,
    price: item.listing.price,
    startsAt: isService,
    rating: item.creator?.rating ?? 4.8,
    deliveryTime: item.listing.turnaround,
    description: item.listing.description,
    artistHref: `/creators/${item.listing.creatorHandle}`,
    listingHref: `/listing/${item.listing.id}`,
    reasons: item.reasons
  };
}

function isUsefulMatch(item: ScoredListing, input: JamMatchInput, promptTokens: string[]) {
  if (item.score < 32) return false;
  if (!item.categoryMatch || !item.genreMatch || !item.budgetMatch) return false;
  if (!item.deadlineMatch || !item.workTypeMatch) return false;
  if (promptTokens.length > 0 && item.semanticHits === 0) return false;
  return input.categoryIds.length > 0 || promptTokens.length > 0;
}

function isWithinBudget(price: number, budget: JamMatchBudget) {
  if (budget.max !== undefined && price > budget.max) return false;
  if (budget.max === undefined) return true;
  return price >= budget.min;
}

function scoreBudget(price: number, budget: JamMatchBudget, language: JamMatchInput["language"]) {
  if (isWithinBudget(price, budget)) {
    return { score: 16, reason: language === "tr" ? "Bütçeye uygun" : "Within budget" };
  }
  if (budget.max !== undefined && price <= budget.max * 1.15) {
    return { score: 2, reason: language === "tr" ? "Bütçeye yakın" : "Near budget" };
  }
  return { score: -12, reason: "" };
}

function scoreBpm(
  listingBpm: number | null,
  promptBpm: number | null,
  language: JamMatchInput["language"]
) {
  if (!promptBpm || !listingBpm) return { score: 0, reason: "" };
  const difference = Math.abs(listingBpm - promptBpm);
  if (difference <= 3) {
    return { score: 13, reason: language === "tr" ? "BPM uyumu" : "BPM fit" };
  }
  if (difference <= 10) {
    return { score: 6, reason: language === "tr" ? "BPM yakın" : "Close BPM" };
  }
  return { score: -8, reason: "" };
}

function isWithinDeadline(deliverySpeed: Listing["deliverySpeed"], deadlineId: string) {
  if (deadlineId === "24h") return deliverySpeed === "instant";
  if (deadlineId === "3-days") return deliverySpeed === "instant" || deliverySpeed === "fast";
  return true;
}

function scoreDeadline(
  deliverySpeed: Listing["deliverySpeed"],
  deadlineId: string,
  language: JamMatchInput["language"]
) {
  if (deadlineId === "flexible") return { score: 3, reason: "" };
  if (isWithinDeadline(deliverySpeed, deadlineId)) {
    return {
      score: deadlineId === "24h" ? 12 : 9,
      reason: language === "tr" ? "Teslim süresi uygun" : "Deadline fit"
    };
  }
  return { score: -10, reason: "" };
}

function matchesWorkType(listing: Listing, workType?: JamMatchWorkType) {
  if (!workType) return true;
  const isCustom = listing.licenseType === "Service" || listing.category === "Custom Production";
  return workType === "custom" ? isCustom : !isCustom;
}

function extractPromptBudget(prompt: string) {
  const currencyMatch = prompt.match(/(?:\$|usd|dolar|dollar)\s*(\d{2,5})|(\d{2,5})\s*(?:\$|usd|dolar|dollar)/);
  if (currencyMatch) {
    const value = Number(currencyMatch[1] ?? currencyMatch[2]);
    return Number.isFinite(value) ? value : null;
  }
  const budgetMatch = prompt.match(/(?:budget|bütçe|butce|around|yaklaşık|civarı)\D{0,16}(\d{2,5})/);
  if (!budgetMatch) return null;
  const value = Number(budgetMatch[1]);
  return Number.isFinite(value) ? value : null;
}

function extractPromptBpm(prompt: string) {
  const match = prompt.match(/(\d{2,3})\s*bpm/);
  if (!match) return null;
  const value = Number(match[1]);
  return value >= 40 && value <= 240 ? value : null;
}

function dedupeResults(results: JamMatchResult[]) {
  const seen = new Set<string>();
  return results.filter((result) => {
    const key = `${result.kind}-${result.kind === "artist" ? result.artistHref : result.listingHref}`;
    if (seen.has(key)) return false;
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
  if (!normalizedToken) return false;
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
