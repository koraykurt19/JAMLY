import type { Language } from "@/lib/i18n";

/**
 * Copy for the pre-launch Early Access page. Kept out of the shared `messages`
 * dictionary because it is launch-scoped: when Jamly goes live this page and
 * its copy retire together, without touching the app-wide MessageKey union.
 */
export const earlyAccessCopy = {
  tr: {
    metaTitle: "Jamly Erken Erişim — Kurucu üye ol",
    metaDescription:
      "Jamly, bağımsız müzik üreticileri için beat lisansı, hizmet ve iş birliği pazarı. Erken kayıt ol, kullanıcı adını ayır, kurucu üye rozetini kazan.",

    badge: "Lansman öncesi",
    heroTitle: "Müziğini satacağın yer açılmak üzere",
    heroSubtitle:
      "Beat lisansları, miks, mastering, söz yazımı ve vokal işleri için tek bir Jam Alanı. Erken kayıt ol, kullanıcı adını şimdiden ayır ve açılışta kurucu üye rozetiyle başla.",
    heroCta: "Kurucu üye ol",
    heroSecondary: "Neler var?",
    counterLabel: "kişi sırada",
    counterVerified: "doğrulanmış",
    counterCreators: "üretici",
    counterEmpty: "İlk kaydolan sen ol",

    valueTitle: "Jamly ne sunuyor?",
    valueSubtitle: "Dağınık DM'ler ve güvensiz dosya transferleri yerine tek bir çalışma alanı.",

    features: [
      {
        icon: "music",
        title: "Lisanslı beat alışverişi",
        body: "Non-exclusive, unlimited ve exclusive katmanları net şartlarla. Satın aldığın lisansın metni ve dosyaları donar — satıcı sonradan değiştiremez."
      },
      {
        icon: "sliders",
        title: "Hizmet pazarı",
        body: "Miks, mastering, söz yazımı, vokal, enstrüman ve kapak tasarımı. Brief ver, teklif al, işi platformda takip et."
      },
      {
        icon: "sparkles",
        title: "Jam Match",
        body: "Projeni anlat, sana uygun üreticiyi ve hazır işleri getirelim. Arama yapmak yerine eşleşin."
      },
      {
        icon: "users",
        title: "Collab çalışma alanı",
        body: "Özel projeler, sürüm geçmişi, dalga formu üzerinde zaman damgalı yorum ve baştan tanımlı gelir paylaşımı."
      },
      {
        icon: "shield",
        title: "Hak ve güven yönetimi",
        body: "Sahiplik beyanı, üçüncü taraf sample bildirimi ve satın alma anında dondurulan lisans kaydı."
      },
      {
        icon: "wallet",
        title: "Şeffaf ödeme akışı",
        body: "Sipariş durumu, teslimat ve gelir paylaşımı tek yerde izlenir. Ödeme altyapısı lansmanda devreye giriyor."
      }
    ],

    audienceTitle: "Kimler için?",
    audiences: [
      {
        key: "creator",
        title: "Üreticiler",
        body: "Beat ve hizmetlerini yayınla, portföyünü göster, düzenli iş akışı kur.",
        points: ["Katmanlı lisans fiyatlandırma", "Özel teslimat paketleri", "Gelir paylaşımı", "Doğrulanmış üretici rozeti"]
      },
      {
        key: "buyer",
        title: "Sanatçılar ve alıcılar",
        body: "Doğru sesi bul, şartları net gör, işi tek yerden yönet.",
        points: ["Filtreli keşif", "Önizleme dinleme", "Net lisans şartları", "Sipariş takibi"]
      }
    ],

    howTitle: "Nasıl işliyor?",
    howSteps: [
      { title: "Erken kayıt ol", body: "E-postanı doğrula, sıradaki yerini al." },
      { title: "Kullanıcı adını ayır", body: "İstediğin handle'ı şimdiden rezerve et." },
      { title: "Arkadaşlarını davet et", body: "Davet linkinle sırada yüksel, destekçi rozetini kazan." },
      { title: "Açılışta ilk sen gir", body: "Davetin geldiğinde hesabın ve rozetlerin hazır olsun." }
    ],

    formTitle: "Erken kayıt",
    formSubtitle: "Sadece e-posta yeterli. Diğer alanlar isteğe bağlı.",
    fieldEmail: "E-posta",
    fieldEmailHint: "Doğrulama bağlantısı bu adrese gider.",
    fieldName: "Görünen ad",
    fieldNameHint: "İsteğe bağlı.",
    fieldUsername: "Kullanıcı adı ayır",
    fieldUsernameHint: "Küçük harf, rakam ve tire. Açılışta senin için tutulur.",
    fieldPersona: "Jamly'yi nasıl kullanacaksın?",
    personaCreator: "Üretici olarak satacağım",
    personaBuyer: "Alıcı olarak iş vereceğim",
    personaBoth: "İkisi de",
    fieldInterests: "İlgi alanların",
    consentTerms: "Kullanım şartlarını ve gizlilik politikasını okudum, kabul ediyorum.",
    consentMarketing: "Lansman ve ürün haberlerini e-posta ile almak istiyorum.",
    submit: "Erken kayıt ol",
    submitting: "Kaydediliyor...",

    successTitle: "Sıradasın",
    successBody: "E-postana bir doğrulama bağlantısı gönderdik. Doğruladığında sıran kesinleşir ve kurucu üye rozetine hak kazanırsın.",
    successExisting: "Bu adres zaten kayıtlı. Sıradaki yerin korunuyor.",
    positionLabel: "Sıra numaran",
    referralTitle: "Davet linkin",
    referralBody: "Bu linkle katılan her doğrulanmış kişi sıranı yükseltir. 3 davette Erken Destekçi rozetini kazanırsın.",
    copyLink: "Linki kopyala",
    copied: "Kopyalandı",

    interestLabels: {
      beats: "Beat",
      mixing: "Miks",
      mastering: "Mastering",
      songwriting: "Söz yazımı",
      vocals: "Vokal",
      instruments: "Enstrüman",
      cover_art: "Kapak tasarımı",
      collab: "İş birliği"
    },

    faqTitle: "Sık sorulanlar",
    faq: [
      {
        q: "Erken kayıt ücretli mi?",
        a: "Hayır. Erken kayıt tamamen ücretsizdir ve hiçbir ödeme bilgisi istemiyoruz."
      },
      {
        q: "Kullanıcı adı rezervasyonu garanti mi?",
        a: "Doğrulanmış kayıtlar için adını lansmana kadar tutuyoruz. Doğrulanmamış kayıtlarda rezervasyon düşebilir."
      },
      {
        q: "Kurucu üye rozeti nedir?",
        a: "Lansman öncesi kaydolup e-postasını doğrulayan ilk topluluğa verilen kalıcı bir profil rozetidir. Geri alınmaz."
      },
      {
        q: "Verilerim ne olacak?",
        a: "E-postanı yalnızca lansman bildirimi ve kabul ettiysen ürün haberleri için kullanıyoruz. İstediğin an çıkabilirsin, kaydın silinir."
      },
      {
        q: "Ne zaman açılıyorsunuz?",
        a: "Kapalı beta davetleri kademeli gidiyor. Sıranı ve davetini e-posta ile bildireceğiz."
      },
      {
        q: "Ödeme nasıl çalışacak?",
        a: "Satın alma, teslimat ve gelir paylaşımı platform içinde yürür. Ödeme sağlayıcısı entegrasyonu lansmanda devreye alınıyor."
      }
    ],

    finalTitle: "Açılışta hazır ol",
    finalBody: "Sıranı al, kullanıcı adını ayır, kurucu üye rozetini kazan.",
    legalNote: "Erken kayıt olarak Kullanım Şartları ve Gizlilik Politikası'nı kabul edersin."
  },

  en: {
    metaTitle: "Jamly Early Access — Become a founding member",
    metaDescription:
      "Jamly is a marketplace for beat licensing, music services and creator collaboration. Join early access, reserve your username, earn the founding member badge.",

    badge: "Before launch",
    heroTitle: "The place to sell your music is almost open",
    heroSubtitle:
      "One Jam Place for beat licenses, mixing, mastering, songwriting and vocal work. Join early, reserve your username, and start launch day with a founding member badge.",
    heroCta: "Become a founding member",
    heroSecondary: "What's inside?",
    counterLabel: "people waiting",
    counterVerified: "verified",
    counterCreators: "creators",
    counterEmpty: "Be the first to join",

    valueTitle: "What Jamly gives you",
    valueSubtitle: "One workspace instead of scattered DMs and unsafe file transfers.",

    features: [
      {
        icon: "music",
        title: "Licensed beat trading",
        body: "Non-exclusive, unlimited and exclusive tiers with clear terms. The license text and files you bought are frozen — a seller cannot change them later."
      },
      {
        icon: "sliders",
        title: "Service marketplace",
        body: "Mixing, mastering, songwriting, vocals, instruments and cover art. Post a brief, get offers, track the work on-platform."
      },
      {
        icon: "sparkles",
        title: "Jam Match",
        body: "Describe your project and we surface the right creators and ready-made work. Match instead of search."
      },
      {
        icon: "users",
        title: "Collab workspace",
        body: "Private projects, version history, timestamped comments on the waveform, and revenue splits agreed up front."
      },
      {
        icon: "shield",
        title: "Rights and trust",
        body: "Ownership declarations, third-party sample disclosure, and a license record frozen at the moment of purchase."
      },
      {
        icon: "wallet",
        title: "Transparent order flow",
        body: "Order status, delivery and revenue splits tracked in one place. Payment infrastructure goes live at launch."
      }
    ],

    audienceTitle: "Who it's for",
    audiences: [
      {
        key: "creator",
        title: "Creators",
        body: "Publish beats and services, show your portfolio, build a steady pipeline.",
        points: ["Tiered license pricing", "Private delivery packages", "Revenue splits", "Verified creator badge"]
      },
      {
        key: "buyer",
        title: "Artists and buyers",
        body: "Find the right sound, see the terms clearly, manage the work in one place.",
        points: ["Filtered discovery", "Preview playback", "Clear license terms", "Order tracking"]
      }
    ],

    howTitle: "How it works",
    howSteps: [
      { title: "Join early access", body: "Verify your email and lock in your place." },
      { title: "Reserve your username", body: "Claim the handle you want before launch." },
      { title: "Invite your circle", body: "Move up with your referral link and earn the supporter badge." },
      { title: "Walk in first at launch", body: "When your invite lands, your account and badges are ready." }
    ],

    formTitle: "Early access",
    formSubtitle: "Email is all we need. Everything else is optional.",
    fieldEmail: "Email",
    fieldEmailHint: "The verification link goes to this address.",
    fieldName: "Display name",
    fieldNameHint: "Optional.",
    fieldUsername: "Reserve a username",
    fieldUsernameHint: "Lowercase letters, numbers and hyphens. Held for you at launch.",
    fieldPersona: "How will you use Jamly?",
    personaCreator: "Selling as a creator",
    personaBuyer: "Hiring as a buyer",
    personaBoth: "Both",
    fieldInterests: "What interests you",
    consentTerms: "I have read and accept the Terms of Use and Privacy Policy.",
    consentMarketing: "Email me launch and product news.",
    submit: "Join early access",
    submitting: "Saving...",

    successTitle: "You're on the list",
    successBody: "We sent a verification link to your inbox. Verifying confirms your place and qualifies you for the founding member badge.",
    successExisting: "This address is already registered. Your place is safe.",
    positionLabel: "Your position",
    referralTitle: "Your invite link",
    referralBody: "Every verified person who joins with this link moves you up. Three referrals earns the Early Supporter badge.",
    copyLink: "Copy link",
    copied: "Copied",

    interestLabels: {
      beats: "Beats",
      mixing: "Mixing",
      mastering: "Mastering",
      songwriting: "Songwriting",
      vocals: "Vocals",
      instruments: "Instruments",
      cover_art: "Cover art",
      collab: "Collaboration"
    },

    faqTitle: "Frequently asked",
    faq: [
      {
        q: "Does early access cost anything?",
        a: "No. Early access is free and we never ask for payment details."
      },
      {
        q: "Is my username reservation guaranteed?",
        a: "We hold your name until launch for verified entries. Unverified entries may lose the reservation."
      },
      {
        q: "What is the founding member badge?",
        a: "A permanent profile badge for the first community who joined and verified before launch. It is never revoked."
      },
      {
        q: "What happens to my data?",
        a: "We use your email for launch notifications, and product news only if you opted in. You can leave at any time and your entry is deleted."
      },
      {
        q: "When do you launch?",
        a: "Closed beta invites go out in batches. We will email you your place and your invite."
      },
      {
        q: "How will payments work?",
        a: "Purchase, delivery and revenue splits run on-platform. The payment provider integration goes live at launch."
      }
    ],

    finalTitle: "Be ready on day one",
    finalBody: "Take your place, reserve your username, earn the founding member badge.",
    legalNote: "By joining early access you accept the Terms of Use and Privacy Policy."
  }
} as const;

export function getEarlyAccessCopy(language: Language) {
  return earlyAccessCopy[language] ?? earlyAccessCopy.en;
}
