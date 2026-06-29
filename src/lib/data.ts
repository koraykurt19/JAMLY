import type { Creator, Listing, ListingCategory, OrderRequest } from "@/lib/types";
import { socialLinksFromRecord } from "@/lib/social-links";

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
    profileStrength: 92,
    socialLinks: socialLinksFromRecord({
      spotify: "https://open.spotify.com/",
      instagram: "https://instagram.com/miravoss",
      youtube: "https://youtube.com/@miravoss"
    })
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
    profileStrength: 89,
    socialLinks: socialLinksFromRecord({
      spotify: "https://open.spotify.com/",
      instagram: "https://instagram.com/kairovale",
      soundcloud: "https://soundcloud.com/kairovale"
    })
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
    profileStrength: 84,
    socialLinks: socialLinksFromRecord({
      instagram: "https://instagram.com/solagrey",
      youtube: "https://youtube.com/@solagrey",
      website: "https://example.com/solagrey"
    })
  },
  {
    id: "creator-dex",
    handle: "dex",
    name: "Dex Monroe",
    role: "creator",
    headline: "R&B, pop ve indie kayıtlar için temiz gitar partileri",
    location: "Nashville, TN",
    avatarUrl:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=500&q=80",
    coverUrl:
      "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=1600&q=80",
    rating: 4.93,
    completedOrders: 98,
    responseTime: "4 saat",
    verified: true,
    specialties: ["Gitar", "R&B", "Canlı loop"],
    about:
      "Dex; single, demo ve reklam projeleri için DI + amfi tonlu gitar stemleri, temiz ritim katmanları ve hook'u taşıyan melodik cevaplar kaydeder.",
    bestFor: ["Gitar stem", "Pop/R&B single", "Canlı dokunuş"],
    notBestFor: ["Metal solo", "Tam grup prodüksiyonu"],
    workflow: ["Referans tonu dinler", "Ritim ve lead yönünü ayırır", "Temiz stem paketi teslim eder"],
    requirements: ["Demo veya akor yürüyüşü", "BPM", "Referans gitar tonu"],
    faq: [
      {
        question: "DI stem veriyor musun?",
        answer: "Evet, DI stem ve işlenmiş gitar kanalları birlikte teslim edilir."
      },
      {
        question: "Loop mu tam aranjman mı?",
        answer: "Paket kısa loop ya da tam şarkı aranjmanı olarak brief'e göre netleşir."
      }
    ],
    repeatBuyerRate: 62,
    responseRate: 92,
    profileStrength: 87,
    socialLinks: socialLinksFromRecord({
      instagram: "https://instagram.com/dexmonroe",
      spotify: "https://open.spotify.com/",
      website: "https://example.com/dexmonroe"
    })
  },
  {
    id: "creator-rhea",
    handle: "rhea",
    name: "Rhea Lin",
    role: "creator",
    headline: "Söz, jingle ve kısa marka hook'larında hızlı konsept yazarı",
    location: "Austin, TX",
    avatarUrl:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=500&q=80",
    coverUrl:
      "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1600&q=80",
    rating: 4.97,
    completedOrders: 156,
    responseTime: "2 saat",
    verified: true,
    specialties: ["Söz", "Jingle", "Topline"],
    about:
      "Rhea, şarkı fikrini hızlıca mesajı net bir hook'a dönüştürür; marka jingle'larında akılda kalan kısa melodiler ve kullanılabilir söz alternatifleri üretir.",
    bestFor: ["Söz sprint'i", "Jingle hook", "Kampanya melodisi"],
    notBestFor: ["Tam prodüksiyon", "Anonim ghost vocal"],
    workflow: ["Mesajı çıkarır", "3 hook yönü yazar", "Seçilen yönü söz dosyasına işler"],
    requirements: ["Tema veya marka mesajı", "Hedef kitle", "Referans tempo"],
    faq: [
      {
        question: "Kaç alternatif veriyorsun?",
        answer: "Standart pakette üç hook yönü, seçilen yönde bir revizyon dahildir."
      },
      {
        question: "Türkçe söz yazıyor musun?",
        answer: "Evet, İngilizce ve Türkçe brief'lerde çalışabilir."
      }
    ],
    repeatBuyerRate: 69,
    responseRate: 95,
    profileStrength: 90,
    socialLinks: socialLinksFromRecord({
      instagram: "https://instagram.com/rhealin",
      tiktok: "https://tiktok.com/@rhealin",
      youtube: "https://youtube.com/@rhealin"
    })
  },
  {
    id: "creator-atlas",
    handle: "atlas",
    name: "Atlas Row",
    role: "creator",
    headline: "Single ve EP çıkışları için premium kapak görseli sistemi",
    location: "Brooklyn, NY",
    avatarUrl:
      "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=500&q=80",
    coverUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80",
    rating: 4.9,
    completedOrders: 74,
    responseTime: "5 saat",
    verified: false,
    specialties: ["Kapak görseli", "Release branding", "Motion teaser"],
    about:
      "Atlas, şarkı evrenini görsel dile çeviren kapak sistemleri hazırlar: streaming kapak, sosyal kırpımlar ve release duyuru şablonları birlikte düşünülür.",
    bestFor: ["Single kapağı", "EP görsel kimliği", "Sosyal teaser"],
    notBestFor: ["Logo tasarımı", "Aynı gün çizim"],
    workflow: ["Şarkı moodboard'u çıkarır", "İki kreatif yön önerir", "Final dosyaları platform ölçülerinde teslim eder"],
    requirements: ["Şarkı adı", "Referans görsel", "Artist fotoğrafı veya yön tarifi"],
    faq: [
      {
        question: "Streaming ölçüleri dahil mi?",
        answer: "Evet, 3000x3000 kapak ve sosyal medya kırpımları teslim edilir."
      },
      {
        question: "Motion teaser eklenir mi?",
        answer: "Kısa motion teaser ek hizmet olarak brief'e eklenebilir."
      }
    ],
    repeatBuyerRate: 55,
    responseRate: 88,
    profileStrength: 82,
    socialLinks: socialLinksFromRecord({
      instagram: "https://instagram.com/atlasrow",
      website: "https://example.com/atlasrow"
    })
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
  },
  {
    id: "neon-session-guitar",
    creatorId: "creator-dex",
    creatorHandle: "dex",
    creatorName: "Dex Monroe",
    creatorAvatarUrl:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=500&q=80",
    title: "Neon Session Guitar",
    category: "Guitar",
    genre: "Pop/R&B",
    bpm: null,
    price: 120,
    description:
      "Single'ınız için temiz DI ve işlenmiş gitar stemleri: parlak ritim katmanı, kısa lead cevapları ve hook'u dolduran canlı loop seçenekleri.",
    audioPreviewUrl:
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
    coverImageUrl:
      "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=1000&q=80",
    licenseType: "Service",
    turnaround: "3 gün",
    tags: ["Gitar", "R&B", "DI stem", "Canlı loop"],
    moods: ["Warm", "Smooth"],
    useCases: ["Single", "Sync"],
    deliverySpeed: "fast",
    deliverables: ["DI gitar", "İşlenmiş gitar stemleri", "Kısa aranjman notu"],
    filesIncluded: ["DI WAV", "Amp WAV", "Loop refs"],
    revisionPolicy: "Bir ton ve performans notu turu dahildir.",
    markers: [
      { label: "Ritim", time: 12 },
      { label: "Lead cevap", time: 48 },
      { label: "Hook loop", time: 83 }
    ],
    exclusiveAvailable: false,
    commercialUse: true,
    analytics: { views: 680, saves: 54, plays: 342, conversionRate: 8.8 },
    createdAt: "2026-06-13T12:00:00.000Z"
  },
  {
    id: "lyrics-hook-sprint",
    creatorId: "creator-rhea",
    creatorHandle: "rhea",
    creatorName: "Rhea Lin",
    creatorAvatarUrl:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=500&q=80",
    title: "Lyrics & Hook Sprint",
    category: "Lyrics",
    genre: "Pop",
    bpm: null,
    price: 150,
    description:
      "Şarkı fikriniz için üç güçlü hook yönü, söz dosyası ve seçilen yöne göre kısa topline notları. Özellikle hızlı single yazım seansları için.",
    audioPreviewUrl:
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    coverImageUrl:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1000&q=80",
    licenseType: "Service",
    turnaround: "48 saat",
    tags: ["Söz", "Hook", "Topline", "Türkçe/İngilizce"],
    moods: ["Bright", "Warm"],
    useCases: ["Single", "TikTok"],
    deliverySpeed: "fast",
    deliverables: ["3 hook yönü", "Söz dosyası", "Topline notu"],
    filesIncluded: ["Lyrics PDF", "Melody memo", "Reference notes"],
    revisionPolicy: "Seçilen hook yönünde bir revizyon turu dahildir.",
    markers: [
      { label: "Hook A", time: 18 },
      { label: "Hook B", time: 46 },
      { label: "Final note", time: 74 }
    ],
    exclusiveAvailable: false,
    commercialUse: true,
    analytics: { views: 1030, saves: 104, plays: 590, conversionRate: 12.1 },
    createdAt: "2026-06-14T12:00:00.000Z",
    featured: true
  },
  {
    id: "brand-jingle-hook",
    creatorId: "creator-rhea",
    creatorHandle: "rhea",
    creatorName: "Rhea Lin",
    creatorAvatarUrl:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=500&q=80",
    title: "Brand Jingle Hook",
    category: "Jingle",
    genre: "Brand Jingle",
    bpm: null,
    price: 320,
    description:
      "Reklam, podcast intro veya sosyal kampanya için akılda kalan kısa jingle melodisi, söz yönü ve iki alternatif slogan fikri.",
    audioPreviewUrl:
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
    coverImageUrl:
      "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1000&q=80",
    licenseType: "Service",
    turnaround: "1 hafta",
    tags: ["Jingle", "Marka", "Slogan", "Kısa hook"],
    moods: ["Bright", "Club"],
    useCases: ["Ad", "Podcast"],
    deliverySpeed: "standard",
    deliverables: ["Jingle melodisi", "Söz/slogan önerileri", "Kullanım notu"],
    filesIncluded: ["Demo WAV", "Lyrics PDF", "Brand notes"],
    revisionPolicy: "Bir konsept revizyonu dahildir; yeni kampanya mesajı yeni kapsam sayılır.",
    markers: [
      { label: "Logo hook", time: 8 },
      { label: "Tagline", time: 27 },
      { label: "Alt slogan", time: 51 }
    ],
    exclusiveAvailable: false,
    commercialUse: true,
    analytics: { views: 540, saves: 48, plays: 270, conversionRate: 7.9 },
    createdAt: "2026-06-15T12:00:00.000Z"
  },
  {
    id: "launch-cover-system",
    creatorId: "creator-atlas",
    creatorHandle: "atlas",
    creatorName: "Atlas Row",
    creatorAvatarUrl:
      "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=500&q=80",
    title: "Launch Cover System",
    category: "Cover Art",
    genre: "Cover Art",
    bpm: null,
    price: 220,
    description:
      "Single veya EP için premium kapak görseli, sosyal medya kırpımları ve release duyuru görselleri. Şarkı mood'una göre iki kreatif yön hazırlanır.",
    audioPreviewUrl:
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
    coverImageUrl:
      "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1000&q=80",
    licenseType: "Service",
    turnaround: "5 gün",
    tags: ["Kapak görseli", "Release", "Sosyal medya", "Moodboard"],
    moods: ["Cinematic", "Dark"],
    useCases: ["Single", "Ad"],
    deliverySpeed: "standard",
    deliverables: ["3000x3000 kapak", "Sosyal kırpımlar", "Release duyuru görseli"],
    filesIncluded: ["PNG cover", "JPG variants", "Social crops"],
    revisionPolicy: "Seçilen kreatif yönde iki görsel revizyon turu dahildir.",
    markers: [
      { label: "Mood", time: 0 },
      { label: "Direction A", time: 32 },
      { label: "Launch kit", time: 68 }
    ],
    exclusiveAvailable: false,
    commercialUse: true,
    analytics: { views: 790, saves: 82, plays: 210, conversionRate: 9.4 },
    createdAt: "2026-06-16T12:00:00.000Z"
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
  "Custom Production",
  "Guitar",
  "Lyrics",
  "Jingle",
  "Cover Art"
];

export const genres = [
  "Trap Soul",
  "Pop",
  "Hip-Hop",
  "Afrobeats",
  "Indie Pop",
  "Pop/R&B",
  "Brand Jingle",
  "Cover Art",
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
