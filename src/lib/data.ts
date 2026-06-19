import type { Creator, Listing, ListingCategory, OrderRequest } from "@/lib/types";

export const creators: Creator[] = [
  {
    id: "creator-mira",
    handle: "mira",
    name: "Mira Voss",
    role: "creator",
    headline: "Parlak pop prodüksiyonu ve vokal mimarisi",
    location: "Los Angeles, CA",
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=80",
    coverUrl:
      "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1600&q=80",
    rating: 4.98,
    completedOrders: 187,
    responseTime: "1 saat",
    verified: true,
    specialties: ["Alt pop", "Vokal prodüksiyon", "Hook yazımı"],
    about:
      "Mira, kendi tavrını kaybetmeden büyük plak şirketi seviyesinde bir bitiş isteyen bağımsız sanatçılar için parlak ve radyoya hazır kayıtlar üretir.",
    bestFor: ["Pop single", "Hook kilitleme", "Vokal prodüksiyon"],
    notBestFor: ["Aynı gün teslim", "Beat lease kataloğu"],
    workflow: ["Referansları dinler", "Hook yönünü çıkarır", "Demo vokal ve söz dosyasını teslim eder"],
    requirements: ["Beat veya demo linki", "Referans şarkı", "Söz yönü veya tema"],
    faq: [
      {
        question: "Revizyon dahil mi?",
        answer: "Bir melodi/söz revizyon turu dahildir; kapsam kayıt başlamadan netleşir."
      },
      {
        question: "Vokal stem teslim edilir mi?",
        answer: "Dry demo vokal, armoni referansı ve söz dosyası teslim edilir."
      }
    ],
    repeatBuyerRate: 64,
    responseRate: 96,
    profileStrength: 92
  },
  {
    id: "creator-kairo",
    handle: "kairo",
    name: "Kairo Vale",
    role: "creator",
    headline: "Temiz stem'lerle trap, R&B ve sinematik drill beat'leri",
    location: "Atlanta, GA",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80",
    coverUrl:
      "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1600&q=80",
    rating: 4.95,
    completedOrders: 243,
    responseTime: "2 saat",
    verified: true,
    specialties: ["Trap", "R&B", "Drill"],
    about:
      "Kairo; ayrılmış stem'ler, düzenleme notları ve alıcı dostu lisanslarla cilalı beat paketleri ve özel prodüksiyon hizmetleri sunar.",
    bestFor: ["Trap/R&B single", "Stemli beat", "Özel drill prodüksiyonu"],
    notBestFor: ["Akustik kayıt", "Canlı band aranjmanı"],
    workflow: ["Referans ve BPM netleşir", "Beat yönü seçilir", "Stem ve lisans paketi teslim edilir"],
    requirements: ["Referans parça", "Vokal tonu veya artist örneği", "Lisans kullanım amacı"],
    faq: [
      {
        question: "Trackout stem var mı?",
        answer: "Premium ve özel lisanslarda WAV, MP3 ve trackout stem paketi dahildir."
      },
      {
        question: "Özel beat yaptırabilir miyim?",
        answer: "Evet, kısa brief ve iki referansla custom production talebi açabilirsiniz."
      }
    ],
    repeatBuyerRate: 71,
    responseRate: 94,
    profileStrength: 89
  },
  {
    id: "creator-sola",
    handle: "sola",
    name: "Sola Grey",
    role: "creator",
    headline: "Yakın vokaller ve güçlü low-end için miks mühendisi",
    location: "New York, NY",
    avatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80",
    coverUrl:
      "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1600&q=80",
    rating: 4.91,
    completedOrders: 121,
    responseTime: "3 saat",
    verified: false,
    specialties: ["Miks", "Mastering", "Vokal zincirleri"],
    about:
      "Sola; vokalleri önde tutan, davulları bilinçli hissettiren ve streaming master'larını sertleşmeden yüksek duyuran mikslerde uzmanlaşır.",
    bestFor: ["Vokal ağırlıklı miks", "Streaming master", "Low-end kontrolü"],
    notBestFor: ["Eksik kayıt kurtarma", "Sıfırdan prodüksiyon"],
    workflow: ["Stemleri kontrol eder", "İlk miks pass çıkarır", "Revizyon notlarını uygular"],
    requirements: ["Kuru vokal stemleri", "Beat/instrumental", "Referans master"],
    faq: [
      {
        question: "Kaç revizyon var?",
        answer: "Miks paketinde iki, mastering paketinde bir revizyon turu dahildir."
      },
      {
        question: "Teslim formatı nedir?",
        answer: "Final WAV, MP3 ve talebe göre instrumental/acapella çıktısı hazırlanır."
      }
    ],
    repeatBuyerRate: 58,
    responseRate: 91,
    profileStrength: 84
  }
];

export const listings: Listing[] = [
  {
    id: "night-shift-bounce",
    creatorId: "creator-kairo",
    creatorHandle: "kairo",
    creatorName: "Kairo Vale",
    creatorAvatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80",
    title: "Gece Mesaisi Bounce",
    category: "Beat",
    genre: "Trap Soul",
    bpm: 142,
    price: 79,
    description:
      "Geniş klavyeler, temiz 808 hareketi ve hook'a hazır aranjmanla karanlık bir trap soul beat. Premium lisanslarda WAV, MP3 ve track-out stem'ler dahildir.",
    audioPreviewUrl:
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    coverImageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=80",
    licenseType: "Premium Lease",
    turnaround: "Anında teslim",
    tags: ["Karanlık", "808", "Melodik", "Stem"],
    moods: ["Dark", "Smooth"],
    useCases: ["Single", "TikTok"],
    deliverySpeed: "instant",
    deliverables: ["WAV + MP3", "Trackout stem", "Lisans özeti"],
    filesIncluded: ["WAV", "MP3", "Trackouts"],
    revisionPolicy: "Beat lisansında revizyon yok; özel düzenleme ayrı talep edilir.",
    markers: [
      { label: "Intro", time: 0 },
      { label: "Hook", time: 39 },
      { label: "Verse", time: 75 }
    ],
    exclusiveAvailable: true,
    commercialUse: true,
    analytics: { views: 1840, saves: 142, plays: 930, conversionRate: 8.4 },
    createdAt: "2026-06-03T12:00:00.000Z",
    featured: true
  },
  {
    id: "velvet-hook-package",
    creatorId: "creator-mira",
    creatorHandle: "mira",
    creatorName: "Mira Voss",
    creatorAvatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=80",
    title: "Velvet Hook Paketi",
    category: "Songwriting",
    genre: "Pop",
    bpm: null,
    price: 240,
    description:
      "Topline melodi, söz dosyası, dry vokal demo ve referans armoni katmanıyla özel nakarat yazımı. Verse'i veya beat yönü hazır olan sanatçılar için tasarlandı.",
    audioPreviewUrl:
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    coverImageUrl:
      "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1000&q=80",
    licenseType: "Service",
    turnaround: "3 gün",
    tags: ["Topline", "Demo vokal", "Pop", "Söz"],
    moods: ["Bright", "Warm"],
    useCases: ["Single", "Ad"],
    deliverySpeed: "fast",
    deliverables: ["Topline melodi", "Söz dosyası", "Dry demo vokal"],
    filesIncluded: ["Lyrics PDF", "Demo WAV", "Harmony refs"],
    revisionPolicy: "Bir hook yönü revizyonu dahildir.",
    markers: [
      { label: "Hook idea", time: 24 },
      { label: "Harmony", time: 58 },
      { label: "Outro", time: 92 }
    ],
    exclusiveAvailable: false,
    commercialUse: true,
    analytics: { views: 1325, saves: 118, plays: 704, conversionRate: 10.2 },
    createdAt: "2026-06-05T12:00:00.000Z",
    featured: true
  },
  {
    id: "club-ready-mix",
    creatorId: "creator-sola",
    creatorHandle: "sola",
    creatorName: "Sola Grey",
    creatorAvatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80",
    title: "Kulüp Hazır Miks",
    category: "Mixing",
    genre: "Hip-Hop",
    bpm: null,
    price: 180,
    description:
      "48 stem'e kadar tek şarkı için tam miks: vokal tuning temizliği, alan efektleri, miks notları ve iki revizyon turu. Teslimde WAV ve instrumental dahildir.",
    audioPreviewUrl:
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    coverImageUrl:
      "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=1000&q=80",
    licenseType: "Service",
    turnaround: "5 gün",
    tags: ["Miks", "Vokal", "Revizyon", "Stem"],
    moods: ["Club", "Bright"],
    useCases: ["Single", "YouTube"],
    deliverySpeed: "standard",
    deliverables: ["Tam miks", "Instrumental çıktı", "İki revizyon"],
    filesIncluded: ["Final WAV", "MP3", "Instrumental"],
    revisionPolicy: "İki not turu dahildir; yeni kayıt ekleme ayrı kapsama girer.",
    markers: [
      { label: "Before", time: 0 },
      { label: "Vocal lift", time: 42 },
      { label: "Drop", time: 86 }
    ],
    exclusiveAvailable: false,
    commercialUse: true,
    analytics: { views: 910, saves: 76, plays: 488, conversionRate: 7.6 },
    createdAt: "2026-06-07T12:00:00.000Z"
  },
  {
    id: "miami-sunrise-pack",
    creatorId: "creator-kairo",
    creatorHandle: "kairo",
    creatorName: "Kairo Vale",
    creatorAvatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80",
    title: "Miami Gün Doğumu Paketi",
    category: "Beat",
    genre: "Afrobeats",
    bpm: 104,
    price: 129,
    description:
      "Bounce, bas ve perküsif geçişlerle dans pistine hazır üç parlak loop. Hızlı yazım seansları veya özel beat genişletmeleri için ideal.",
    audioPreviewUrl:
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    coverImageUrl:
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1000&q=80",
    licenseType: "Basic Lease",
    turnaround: "Anında teslim",
    tags: ["Afrobeats", "Loop", "Yaz", "Bounce"],
    moods: ["Bright", "Club"],
    useCases: ["TikTok", "Ad"],
    deliverySpeed: "instant",
    deliverables: ["3 loop", "MP3 preview", "Basic lease"],
    filesIncluded: ["WAV loops", "MP3 refs"],
    revisionPolicy: "Loop paketlerinde revizyon yok; custom genişletme ayrı talep edilir.",
    markers: [
      { label: "Loop A", time: 0 },
      { label: "Loop B", time: 36 },
      { label: "Bridge", time: 72 }
    ],
    exclusiveAvailable: true,
    commercialUse: true,
    analytics: { views: 1170, saves: 96, plays: 612, conversionRate: 6.9 },
    createdAt: "2026-06-08T12:00:00.000Z"
  },
  {
    id: "private-vocal-feature",
    creatorId: "creator-mira",
    creatorHandle: "mira",
    creatorName: "Mira Voss",
    creatorAvatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=80",
    title: "Özel Vokal Katkı",
    category: "Vocal Feature",
    genre: "Indie Pop",
    bpm: null,
    price: 390,
    description:
      "Single'ınız için lead vokal, double'lar, armoniler ve dry/wet stem'lerle temiz bir vokal katkı. Kullanım şartları kayıt başlamadan netleştirilir.",
    audioPreviewUrl:
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    coverImageUrl:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1000&q=80",
    licenseType: "Service",
    turnaround: "7 gün",
    tags: ["Katkı", "Armoni", "Indie", "Stem"],
    moods: ["Warm", "Smooth"],
    useCases: ["Single", "Sync"],
    deliverySpeed: "standard",
    deliverables: ["Lead vokal", "Double", "Dry/wet stem"],
    filesIncluded: ["Lead WAV", "Harmony WAV", "Wet refs"],
    revisionPolicy: "Bir performans notu turu dahildir; söz değişimi yeni kapsam sayılır.",
    markers: [
      { label: "Lead", time: 18 },
      { label: "Stack", time: 54 },
      { label: "Ad-lib", time: 110 }
    ],
    exclusiveAvailable: false,
    commercialUse: true,
    analytics: { views: 760, saves: 69, plays: 391, conversionRate: 9.1 },
    createdAt: "2026-06-10T12:00:00.000Z"
  },
  {
    id: "streaming-master",
    creatorId: "creator-sola",
    creatorHandle: "sola",
    creatorName: "Sola Grey",
    creatorAvatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80",
    title: "Streaming Master",
    category: "Mastering",
    genre: "Her Tür",
    bpm: null,
    price: 65,
    description:
      "Spotify, Apple Music, YouTube ve sosyal platformlar için odaklı bir master. Loudness hedef notları, WAV, MP3 ve bir revizyon turu dahildir.",
    audioPreviewUrl:
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    coverImageUrl:
      "https://images.unsplash.com/photo-1461784180009-27c4f04c5a03?auto=format&fit=crop&w=1000&q=80",
    licenseType: "Service",
    turnaround: "48 saat",
    tags: ["Mastering", "Loudness", "Yayına hazır"],
    moods: ["Club", "Cinematic"],
    useCases: ["Single", "Podcast"],
    deliverySpeed: "fast",
    deliverables: ["Streaming master", "Loudness notu", "Bir revizyon"],
    filesIncluded: ["Master WAV", "MP3", "Loudness notes"],
    revisionPolicy: "Bir master revizyonu dahildir; yeni miks dosyası yeni pass sayılır.",
    markers: [
      { label: "A/B", time: 0 },
      { label: "Low end", time: 44 },
      { label: "Final lift", time: 96 }
    ],
    exclusiveAvailable: false,
    commercialUse: true,
    analytics: { views: 1490, saves: 131, plays: 802, conversionRate: 11.4 },
    createdAt: "2026-06-12T12:00:00.000Z",
    featured: true
  }
];

export const orderRequests: OrderRequest[] = [
  {
    id: "ord-1001",
    listingId: "club-ready-mix",
    listingTitle: "Kulüp Hazır Miks",
    buyerName: "Nadia Cruz",
    creatorName: "Sola Grey",
    price: 180,
    status: "In Review",
    createdAt: "2026-06-14T12:00:00.000Z"
  },
  {
    id: "ord-1002",
    listingId: "velvet-hook-package",
    listingTitle: "Velvet Hook Paketi",
    buyerName: "Miles Avery",
    creatorName: "Mira Voss",
    price: 240,
    status: "Requested",
    createdAt: "2026-06-15T12:00:00.000Z"
  },
  {
    id: "ord-1003",
    listingId: "night-shift-bounce",
    listingTitle: "Gece Mesaisi Bounce",
    buyerName: "Jules Park",
    creatorName: "Kairo Vale",
    price: 79,
    status: "Delivered",
    createdAt: "2026-06-11T12:00:00.000Z"
  }
];

export const listingCategories: ListingCategory[] = [
  "Beat",
  "Mixing",
  "Mastering",
  "Songwriting",
  "Vocal Feature",
  "Custom Production"
];

export const genres = [
  "Trap Soul",
  "Pop",
  "Hip-Hop",
  "Afrobeats",
  "Indie Pop",
  "Her Tür"
];

export function getCreatorByHandle(handle: string) {
  return creators.find((creator) => creator.handle === handle);
}

export function getCreatorListings(creatorId: string) {
  return listings.filter((listing) => listing.creatorId === creatorId);
}

export function getListingById(id: string) {
  return listings.find((listing) => listing.id === id);
}

export function getFeaturedListings() {
  return listings.filter((listing) => listing.featured);
}
