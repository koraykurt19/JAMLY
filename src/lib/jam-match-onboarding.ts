import { currency, type DisplayCurrency } from "@/lib/format";
import type { Language } from "@/lib/i18n";
import type { JamMatchWorkType } from "@/lib/jam-match";

export type JamMatchStepId = "need" | "genre" | "budget" | "deadline" | "workType";
export type JamMatchAnswers = Record<JamMatchStepId, string | null>;

export type JamMatchOptionIcon =
  | "beat"
  | "vocal"
  | "lyrics"
  | "mix"
  | "guitar"
  | "jingle"
  | "pack"
  | "producer"
  | "money"
  | "clock"
  | "generic";

export type JamMatchStepOption = {
  id: string;
  label: string;
  description?: string;
  icon?: JamMatchOptionIcon;
};

export type JamMatchStep = {
  id: JamMatchStepId;
  question: string;
  helper: string;
  options: JamMatchStepOption[];
};

export type JamMatchBudgetOption = {
  id: string;
  min: number;
  max?: number;
  presentation: "under" | "range" | "plus";
};

export const emptyJamMatchAnswers: JamMatchAnswers = {
  need: null,
  genre: null,
  budget: null,
  deadline: null,
  workType: null
};

export const jamMatchBudgetOptions: JamMatchBudgetOption[] = [
  { id: "under-25", min: 0, max: 25, presentation: "under" },
  { id: "25-75", min: 25, max: 75, presentation: "range" },
  { id: "75-200", min: 75, max: 200, presentation: "range" },
  { id: "200-plus", min: 200, presentation: "plus" }
];

export const jamMatchCopy = {
  tr: {
    eyebrow: "Jam Match",
    headline: "Doğru sesi beş kısa seçimle bul.",
    subheadline:
      "Projenin ihtiyacını, türünü, bütçesini ve teslim hedefini seç. Jam Match uygun üreticileri ve ilanları senin için sıralasın.",
    step: "Adım",
    of: "/",
    yourBrief: "Proje özeti",
    briefHint: "Her seçimi buradan gözden geçirebilirsin.",
    waiting: "Henüz seçilmedi",
    back: "Geri",
    selected: "Seçildi",
    dataLoading: "Jam Match verileri hazırlanıyor",
    liveData: "Canlı Jamly verisi",
    demoData: "Demo Jamly verisi",
    resultsTitle: "Projene uygun seçenekler",
    resultsCopy: "Cevaplarına göre en güçlü üretici ve ilan eşleşmelerini öne çıkardık.",
    resultCount: "sonuç bulundu",
    editAnswers: "Cevapları düzenle",
    startOver: "Baştan başla",
    matchedArtist: "Eşleşen üretici",
    matchedListing: "Hazır ilan",
    recommendedService: "Önerilen hizmet",
    startingPrice: "Başlangıç fiyatı",
    delivery: "Teslim",
    rating: "Puan",
    match: "uyum",
    fitSignals: "Eşleşme nedenleri",
    viewArtist: "Üreticiyi gör",
    requestOffer: "Teklif iste",
    noResultsTitle: "Bu seçimlerle uygun profil veya ilan bulamadık.",
    noResultsCopy:
      "Bütçeyi veya teslim süresini genişletip tekrar deneyebilirsin. Jamly yalnızca gerçekten uyan sonuçları gösterir.",
    adjustAnswers: "Seçimleri değiştir",
    browseManually: "Jam Alanı'na göz at",
    questions: {
      need: "Ne arıyorsun?",
      genre: "Projene hangi tür uyuyor?",
      budget: "Bütçen nedir?",
      deadline: "Ne kadar hızlı ihtiyacın var?",
      workType: "Hazır bir ürün mü, özel çalışma mı istiyorsun?"
    },
    helpers: {
      need: "Bu proje için ana ihtiyacını seç.",
      genre: "Ses dünyana en yakın türü işaretle.",
      budget: "Bu iş için ayırdığın yaklaşık aralığı seç.",
      deadline: "Gerçekçi teslim hedefini belirle.",
      workType: "Hemen kullanılabilir bir iş veya sana özel üretim seç."
    }
  },
  en: {
    eyebrow: "Jam Match",
    headline: "Find the right sound in five quick picks.",
    subheadline:
      "Choose what you need, your genre, budget, and deadline. Jam Match will rank the right artists and listings for your project.",
    step: "Step",
    of: "of",
    yourBrief: "Your brief",
    briefHint: "Review or change any answer here.",
    waiting: "Not selected yet",
    back: "Back",
    selected: "Selected",
    dataLoading: "Preparing Jam Match data",
    liveData: "Live Jamly data",
    demoData: "Demo Jamly data",
    resultsTitle: "Options that fit your project",
    resultsCopy: "We ranked the strongest artist and listing matches based on your answers.",
    resultCount: "matches found",
    editAnswers: "Edit answers",
    startOver: "Start over",
    matchedArtist: "Matched artist",
    matchedListing: "Ready-made listing",
    recommendedService: "Recommended service",
    startingPrice: "Starting price",
    delivery: "Delivery",
    rating: "Rating",
    match: "match",
    fitSignals: "Why it matches",
    viewArtist: "View Artist",
    requestOffer: "Request Offer",
    noResultsTitle: "No artist or listing fits all of these choices yet.",
    noResultsCopy:
      "Try widening the budget or delivery window. Jamly only shows results that genuinely fit your brief.",
    adjustAnswers: "Adjust answers",
    browseManually: "Browse Jam Place",
    questions: {
      need: "What are you looking for?",
      genre: "Which genre fits your project?",
      budget: "What is your budget?",
      deadline: "How fast do you need it?",
      workType: "Do you want a ready-made product or custom work?"
    },
    helpers: {
      need: "Choose the main thing this project needs.",
      genre: "Pick the closest lane for your sound.",
      budget: "Choose the approximate range for this job.",
      deadline: "Set a realistic delivery target.",
      workType: "Choose something ready to use or work made for you."
    }
  }
} as const;

export function getJamMatchSteps(
  language: Language,
  displayCurrency: DisplayCurrency,
  usdTryRate: number
): JamMatchStep[] {
  const text = jamMatchCopy[language];
  const labels =
    language === "tr"
      ? {
          beat: "Beat",
          vocal: "Vokal",
          lyrics: "Şarkı sözü",
          mixMaster: "Miks & Mastering",
          guitar: "Gitar / Enstrüman riff'i",
          jingle: "Jingle",
          samplePack: "Sample paketi",
          customProducer: "Özel prodüktör",
          hipHop: "Hip-Hop",
          trap: "Trap",
          drill: "Drill",
          rnb: "R&B",
          pop: "Pop",
          afrobeat: "Afrobeat",
          rock: "Rock",
          electronic: "Elektronik",
          other: "Diğer",
          day: "24 saat",
          threeDays: "3 gün",
          week: "1 hafta",
          flexible: "Esnek",
          ready: "Hazır ürün",
          readyDescription: "Lisanslanabilir beat, sample veya hazır paket.",
          custom: "Özel çalışma",
          customDescription: "Brief'ine göre sıfırdan hazırlanan hizmet."
        }
      : {
          beat: "Beat",
          vocal: "Vocal",
          lyrics: "Lyrics",
          mixMaster: "Mixing & Mastering",
          guitar: "Guitar / Instrument Riff",
          jingle: "Jingle",
          samplePack: "Sample Pack",
          customProducer: "Custom Producer",
          hipHop: "Hip-Hop",
          trap: "Trap",
          drill: "Drill",
          rnb: "R&B",
          pop: "Pop",
          afrobeat: "Afrobeat",
          rock: "Rock",
          electronic: "Electronic",
          other: "Other",
          day: "24 hours",
          threeDays: "3 days",
          week: "1 week",
          flexible: "Flexible",
          ready: "Ready-made",
          readyDescription: "A licensable beat, sample, or finished pack.",
          custom: "Custom work",
          customDescription: "A service made from your project brief."
        };

  return [
    {
      id: "need",
      question: text.questions.need,
      helper: text.helpers.need,
      options: [
        { id: "beat", label: labels.beat, icon: "beat" },
        { id: "vocal", label: labels.vocal, icon: "vocal" },
        { id: "lyrics", label: labels.lyrics, icon: "lyrics" },
        { id: "mixing-mastering", label: labels.mixMaster, icon: "mix" },
        { id: "guitar-riff", label: labels.guitar, icon: "guitar" },
        { id: "jingle", label: labels.jingle, icon: "jingle" },
        { id: "sample-pack", label: labels.samplePack, icon: "pack" },
        { id: "custom-producer", label: labels.customProducer, icon: "producer" }
      ]
    },
    {
      id: "genre",
      question: text.questions.genre,
      helper: text.helpers.genre,
      options: [
        { id: "hip-hop", label: labels.hipHop },
        { id: "trap", label: labels.trap },
        { id: "drill", label: labels.drill },
        { id: "r-and-b", label: labels.rnb },
        { id: "pop", label: labels.pop },
        { id: "afrobeat", label: labels.afrobeat },
        { id: "rock", label: labels.rock },
        { id: "electronic", label: labels.electronic },
        { id: "other", label: labels.other }
      ]
    },
    {
      id: "budget",
      question: text.questions.budget,
      helper: text.helpers.budget,
      options: jamMatchBudgetOptions.map((option) => ({
        id: option.id,
        label: formatBudgetOption(option, language, displayCurrency, usdTryRate),
        icon: "money"
      }))
    },
    {
      id: "deadline",
      question: text.questions.deadline,
      helper: text.helpers.deadline,
      options: [
        { id: "24h", label: labels.day, icon: "clock" },
        { id: "3-days", label: labels.threeDays, icon: "clock" },
        { id: "1-week", label: labels.week, icon: "clock" },
        { id: "flexible", label: labels.flexible, icon: "clock" }
      ]
    },
    {
      id: "workType",
      question: text.questions.workType,
      helper: text.helpers.workType,
      options: [
        {
          id: "ready",
          label: labels.ready,
          description: labels.readyDescription,
          icon: "pack"
        },
        {
          id: "custom",
          label: labels.custom,
          description: labels.customDescription,
          icon: "producer"
        }
      ]
    }
  ];
}

export function formatJamMatchResultPrice(
  value: number,
  startsAt: boolean,
  language: Language,
  displayCurrency: DisplayCurrency,
  usdTryRate: number
) {
  const amount = currency(value, language, displayCurrency, usdTryRate);
  if (!startsAt) return amount;
  return language === "tr" ? `${amount}+` : `From ${amount}`;
}

export function toJamMatchWorkType(value: string | null): JamMatchWorkType | undefined {
  return value === "ready" || value === "custom" ? value : undefined;
}

function formatBudgetOption(
  option: JamMatchBudgetOption,
  language: Language,
  displayCurrency: DisplayCurrency,
  usdTryRate: number
) {
  const min = currency(option.min, language, displayCurrency, usdTryRate);
  const max = option.max
    ? currency(option.max, language, displayCurrency, usdTryRate)
    : undefined;

  if (option.presentation === "under" && max) {
    return language === "tr" ? `${max} altı` : `Under ${max}`;
  }
  if (option.presentation === "plus") return `${min}+`;
  return `${min}–${max}`;
}
