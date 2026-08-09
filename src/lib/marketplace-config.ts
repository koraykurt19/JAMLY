export const listingCategories = [
  "Beat",
  "Mixing",
  "Mastering",
  "Songwriting",
  "Vocal Feature",
  "Custom Production",
  "Guitar",
  "Lyrics",
  "Jingle",
  "Cover Art"
] as const;

export const listingMoods = [
  "Dark",
  "Bright",
  "Smooth",
  "Club",
  "Cinematic",
  "Warm"
] as const;

export const listingUseCases = [
  "Single",
  "YouTube",
  "TikTok",
  "Sync",
  "Podcast",
  "Ad"
] as const;

export const deliverySpeeds = ["instant", "fast", "standard"] as const;

export const listingGenreOptions = [
  "Hip-Hop",
  "Trap",
  "Drill",
  "R&B",
  "Pop",
  "Afrobeat",
  "Rock",
  "Electronic",
  "Other"
] as const;

export const marketplaceGenres = [
  "Trap Soul",
  "Pop",
  "Hip-Hop",
  "Afrobeats",
  "Indie Pop",
  "Pop/R&B",
  "Brand Jingle",
  "Cover Art",
  "Her Tür"
] as const;

export const listingTurnaroundOptions = [
  "24 saat",
  "3 gün",
  "1 hafta",
  "Esnek"
] as const;

export type ConfigLanguage = "tr" | "en";

export const categoryLabels = {
  tr: {
    Beat: "Beat",
    Mixing: "Miks",
    Mastering: "Mastering",
    Songwriting: "Şarkı Yazımı",
    "Vocal Feature": "Vokal Katkı",
    "Custom Production": "Özel Prodüksiyon",
    Guitar: "Gitar",
    Lyrics: "Söz",
    Jingle: "Jingle",
    "Cover Art": "Kapak Görseli"
  },
  en: {
    Beat: "Beat",
    Mixing: "Mixing",
    Mastering: "Mastering",
    Songwriting: "Songwriting",
    "Vocal Feature": "Vocal Feature",
    "Custom Production": "Custom Production",
    Guitar: "Guitar",
    Lyrics: "Lyrics",
    Jingle: "Jingle",
    "Cover Art": "Cover Art"
  }
} as const;

export const moodLabels = {
  tr: {
    Dark: "Karanlık",
    Bright: "Parlak",
    Smooth: "Yumuşak",
    Club: "Kulüp",
    Cinematic: "Sinematik",
    Warm: "Sıcak"
  },
  en: {
    Dark: "Dark",
    Bright: "Bright",
    Smooth: "Smooth",
    Club: "Club",
    Cinematic: "Cinematic",
    Warm: "Warm"
  }
} as const;

export const usageLabels = {
  tr: {
    Single: "Single",
    YouTube: "YouTube",
    TikTok: "TikTok",
    Sync: "Sync / reklam",
    Podcast: "Podcast",
    Ad: "Reklam"
  },
  en: {
    Single: "Single",
    YouTube: "YouTube",
    TikTok: "TikTok",
    Sync: "Sync / licensing",
    Podcast: "Podcast",
    Ad: "Ad"
  }
} as const;

export const deliverySpeedLabels = {
  tr: {
    instant: "Anında",
    fast: "Hızlı",
    standard: "Standart"
  },
  en: {
    instant: "Instant",
    fast: "Fast",
    standard: "Standard"
  }
} as const;

export const localizedMarketplaceGenres = {
  tr: [
    "Trap Soul",
    "Pop",
    "Hip-Hop",
    "Afrobeats",
    "Indie Pop",
    "Pop/R&B",
    "Brand Jingle",
    "Cover Art",
    "Tüm türler"
  ],
  en: [
    "Trap Soul",
    "Pop",
    "Hip-Hop",
    "Afrobeats",
    "Indie Pop",
    "Pop/R&B",
    "Brand Jingle",
    "Cover Art",
    "Any Genre"
  ]
} as const;

export const jamMatchCategorySignals = {
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
} as const;

export const jamMatchGenreSignals = {
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
} as const;
