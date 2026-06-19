import type {
  Creator,
  DeliverySpeed,
  LicenseType,
  Listing,
  ListingCategory,
  ListingMood,
  ListingUseCase,
  OrderRequest,
  Role
} from "@/lib/types";

export type Language = "tr" | "en";

export const languageNames: Record<Language, string> = {
  tr: "Türkçe",
  en: "English"
};

export const messages = {
  tr: {
    navMarketplace: "Jam Alanı",
    navCreator: "Üretici",
    navBuyer: "Alıcı",
    navUpload: "İş yayınla",
    navSignIn: "Giriş yap",
    navDashboard: "Paneli aç",
    searchMarketplace: "Jam Alanı'nda ara",
    footerText:
      "Beat lisansları, miks/master işleri ve özel prodüksiyon talepleri için seçilmiş Jam Alanı.",
    footerMarketplace: "Jam Alanı",
    footerUpload: "İş yayınla",
    footerAccount: "Hesap oluştur",
    heroEyebrow: "Beat lisansları ve müzik hizmetleri için tek vitrin",
    heroTitle: "Jamly",
    heroDescription:
      "Beat satın alın, miks/master hizmeti bulun, hook yazdırın ya da özel prodüksiyon için proje özeti açın. Jamly, bağımsız sanatçılarla güvenilir üreticileri tek, düzenli ve premium bir çalışma akışında buluşturur.",
    heroPrimary: "Jam Alanı'nı keşfet",
    heroSecondary: "Üretici olarak başla",
    statCategories: "Yaratıcı alan",
    statCategoriesDetail: "Beat, miks, master, hook, vokal katkı",
    statOrderFlow: "Talep akışı",
    statOrderFlowValue: "Hazır",
    statOrderFlowDetail: "Ödeme adımı sonraki sürümde",
    statSupabase: "Altyapı hazır",
    statSupabaseDetail: "Kimlik, veritabanı ve erişim kuralları",
    featuredEyebrow: "Öne çıkan işler",
    featuredTitle: "Seansa girmeden sesi netleştirin.",
    featuredDescription:
      "Her iş; ses önizlemesi, teslim kapsamı, lisans tipi ve üretici güven sinyalleriyle alıcının hızlı karar vermesini sağlar.",
    viewAll: "Tümünü gör",
    creatorSpotlight: "Üretici vitrini",
    openProfile: "Profili aç",
    verified: "Onaylı",
    creatorLabel: "Üretici",
    orders: "Sipariş",
    rating: "Puan",
    workflowEyebrow: "Keşif akışı",
    workflowTitle: "Dinle, karşılaştır, güvenle talep gönder.",
    workflowDescription:
      "Jamly'nin ilk katmanı keşif, güven ve net talep üzerine kurulu. Mesajlaşma, ödeme, dosya teslimi ve sözleşme akışı bu temel üzerine büyüyebilir.",
    workflowPublishTitle: "Üretici işini vitrinde açar",
    workflowPublishCopy:
      "Beat veya hizmet; kapak görseli, ses önizlemesi, fiyat, lisans, BPM, tür ve teslim şartlarıyla anlaşılır bir teklife dönüşür.",
    workflowFilterTitle: "Alıcı doğru eşleşmeyi bulur",
    workflowFilterCopy:
      "Kategori, tür, bütçe, teslim hızı ve güven sinyalleri sayesinde katalog kalabalık değil, seçilmiş hissettirir.",
    workflowRequestTitle: "Talep konuşmaya dönüşür",
    workflowRequestCopy:
      "İlk talep; proje özeti, mesajlaşma, ödeme, güvenli ödeme tutma ve teslim takibine bağlanabilecek temiz bir başlangıç noktasıdır.",
    marketplaceEyebrow: "Jam Alanı",
    marketplaceTitle: "İşinize yakışan sesi ve doğru üreticiyi bulun.",
    marketplaceDescription:
      "Beat lisanslarını ve müzik hizmetlerini; ses önizlemesi, teslim kapsamı, süre, fiyat ve üretici güveniyle yan yana değerlendirin.",
    demoListingsReady: "hazır iş keşifte",
    searchPlaceholder: "Beat, duygu, hizmet veya üretici ara",
    all: "Tümü",
    genre: "Tür",
    genrePlaceholder: "R&B, Trap, Pop",
    maxPrice: "Üst fiyat",
    reset: "Sıfırla",
    sort: "Sırala",
    sortRecommended: "Önerilen",
    sortLowPrice: "Düşük fiyat",
    sortHighPrice: "Yüksek fiyat",
    sortNewest: "En yeni",
    quickFilters: "Hızlı filtreler",
    quickInstant: "Anında teslim",
    quickVerified: "Onaylı üretici",
    quickStems: "Stem dosyaları var",
    listingsFound: "iş bulundu",
    marketplaceHint: "Ödeme kapalı; şu an yalnızca talep oluşturuluyor.",
    noListings: "Eşleşen iş bulunamadı",
    noListingsHint: "Aramayı biraz genişletin veya aktif hızlı filtreleri kaldırın.",
    clearQuickFilters: "Filtreleri temizle",
    backMarketplace: "Jam Alanı'na dön",
    startingAt: "Başlangıç fiyatı",
    bpmOpen: "Serbest",
    delivery: "Teslim",
    preview: "Önizleme",
    streamingUrl: "Dinleme bağlantısı",
    licenseDelivery: "Lisans ve teslim",
    licenseDeliveryCopy:
      "Bu sürüm; iş bilgilerini, dinleme bağlantısını ve alıcı talebini düzenli biçimde tutar. Sonraki adımda ödeme onayı, lisans sözleşmesi, özel dosya teslimi ve itiraz yönetimi aynı sipariş modeli üzerine eklenebilir.",
    published: "Yayınlandı",
    moreFromCreator: "Üreticiden diğer işler",
    similarItems: "Benzer portföy işleri",
    requestOrder: "Sipariş talep et",
    requestSent: "Talep gönderildi",
    orderMessage: "Talebiniz üreticiye iletildi. Bu sürümde ödeme alınmaz.",
    orderHelp:
      "Bu buton yalnızca ön talep oluşturur. Ödeme, üretici ödemesi ve dosya teslimi sonraki geliştirme katmanında açılacak.",
    creatorProfileWork: "İşlerini incele",
    respondsIn: "Ortalama yanıt",
    ratingSuffix: "puan",
    about: "Hakkında",
    completedOrders: "Tamamlanan sipariş",
    averageRating: "Ortalama puan",
    portfolioListings: "Portföy ilanı",
    portfolio: "Portföy",
    beatsServices: "Beatler ve hizmetler",
    creatorDashboardEyebrow: "Üretici paneli",
    creatorDashboardTitle: "Vitrininizi, talepleri ve teslim ritmini yönetin.",
    creatorDashboardDescription:
      "İşlerini yayında tutmak, alıcı taleplerini önceliklendirmek ve profil güvenini artırmak için sade bir operasyon alanı.",
    newListing: "Yeni ilan",
    activeListings: "Aktif ilan",
    activeListingsDetail: "Beatler ve hizmetler",
    openRequests: "Açık talep",
    demoOrderFlow: "Talep akışı",
    projectedRevenue: "Tahmini gelir",
    fromDemoRequests: "Açık taleplerden",
    responseTarget: "Yanıt hedefi",
    premiumStandard: "Premium Jam Alanı standardı",
    publishedListings: "Yayınlanan ilanlar",
    inventoryHint: "Alıcının gördüğü başlığı, kapsamı, etiketi ve teslim vaadini kontrol edin.",
    orderRequests: "Sipariş talepleri",
    buyerIntent: "Alıcının ilk niyetini hızlıca okuyun.",
    buyer: "Alıcı",
    nextBuildTargets: "Sıradaki ürün katmanları",
    nextBuildTargetItems: "Sipariş içi mesajlaşma,Özel dosya teslim alanı,Ödeme ve üretici ödemeleri,Üretici analitiği",
    buyerDashboardEyebrow: "Alıcı paneli",
    buyerDashboardTitle: "Taleplerinizi takip edin, kısa listenizi kaybetmeyin.",
    buyerDashboardDescription:
      "Keşif, proje özeti hazırlığı, kaydedilen işler ve açık talepler aynı çalışma alanında bir araya gelir.",
    findTalent: "Üretici bul",
    savedListings: "Kaydedilen ilan",
    readyCompare: "Karşılaştırmaya hazır",
    avgResponse: "Ort. yanıt",
    spendPreview: "Harcama önizlemesi",
    noRealPayment: "Gerçek ödeme alınmadı",
    requestStateOnly: "Henüz ödeme ekranı yok; bu alanda yalnızca talep durumu izlenir.",
    budgetIntent: "Tahmini bütçe",
    savedListingsTitle: "Kaydedilen ilanlar",
    shortlistHint: "Bir sonraki seans için elinizin altında tutun.",
    creatorsToWatch: "Takip edilecek üreticiler",
    uploadEyebrow: "İş yayınla",
    uploadTitle: "Beat'inizi, hizmetinizi veya özel prodüksiyon teklifinizi yayına alın.",
    uploadDescription:
      "Alıcı hızlı karar versin diye başlığı, kategoriyi, türü, BPM'i, fiyatı, açıklamayı ve lisansı net yazın; ses önizlemesiyle kapak görselini dosya olarak yükleyin.",
    signInEyebrow: "Tekrar hoş geldiniz",
    signInTitle: "Jamly hesabınıza giriş yapın",
    signInDescription: "Panellerinize dönün, işleri yönetin ve taleplerinizi takip edin.",
    signUpEyebrow: "Hesap oluştur",
    signUpTitle: "Üretici ya da alıcı olarak Jamly'ye katılın",
    signUpDescription:
      "Rolünüz güvenli kimlik altyapısında tutulur; profil kaydınız veritabanında otomatik oluşturulur.",
    fullName: "Ad soyad",
    handle: "Kullanıcı adı",
    role: "Rol",
    email: "E-posta",
    password: "Şifre",
    createAccount: "Hesap oluştur",
    alreadyAccount: "Zaten hesabınız var mı?",
    newToJamly: "Jamly'de yeni misiniz?",
    liveAuthMissing: "Canlı giriş için Supabase ortam değişkenlerini ekleyin.",
    supabaseMissing:
      "Supabase henüz yapılandırılmadı. .env.example dosyasını .env.local olarak kopyalayıp proje URL'sini ve anon key değerini ekleyin.",
    signedIn: "Giriş yapıldı. Artık iş yayınlayabilir veya sipariş talep edebilirsiniz.",
    accountCreated: "Hesap oluşturuldu. E-posta doğrulaması açıksa gelen kutunuzu kontrol edin.",
    authError: "İşlem tamamlanamadı",
    formDemoMode:
      "Form hazır; Supabase bilgileri eksik olduğu için .env.local yapılandırılana kadar dosyalar yalnızca bu oturumda yerel önizleme olarak çalışır.",
    title: "Başlık",
    uploadTitlePlaceholder: "Gece yarısı sample paketi",
    category: "Kategori",
    bpm: "BPM",
    optional: "Opsiyonel",
    price: "Fiyat",
    audioPreviewUrl: "Ses önizleme bağlantısı",
    coverImageUrl: "Kapak görseli bağlantısı",
    audioPreviewFile: "Ses önizleme dosyası",
    coverImageFile: "Kapak görseli dosyası",
    audioPreviewFileHint: "MP3, WAV veya M4A yükleyin. Alıcılar için kısa dinleme önizlemesi olarak kullanılır.",
    coverImageFileHint: "JPG, PNG veya WebP yükleyin. İlan kartında ve detay sayfasında kapak olarak görünür.",
    chooseFile: "Dosya seç",
    replaceFile: "Dosyayı değiştir",
    selectedFile: "Seçilen dosya",
    mediaReady: "Önizleme hazır",
    missingMediaFiles: "Ses önizleme ve kapak görseli dosyalarını seçin.",
    unknownError: "Bilinmeyen hata",
    licenseType: "Lisans tipi",
    turnaround: "Teslim süresi",
    turnaroundPlaceholder: "48 saat",
    description: "Açıklama",
    listingDescriptionPlaceholder:
      "Teslim edilecek dosyaları, revizyon hakkını, stemleri, kullanım iznini ve bu işin hangi sanatçıya uygun olduğunu net anlatın.",
    tags: "Etiketler",
    tagsPlaceholder: "808, topline, stem",
    uploadListing: "İlan yükle",
    listingSaved:
      "İlan kaydedildi. Canlı Jam Alanı sorguları bağlandığında listede görünecek.",
    listingStaged:
      "İlan önizlemesi hazırlandı. Kalıcı medya yükleme ve kayıt için Supabase bilgilerini ekleyin.",
    listingError: "İlan kaydedilemedi",
    notFoundTitle: "Bu iş şu anda yayında değil.",
    notFoundCopy: "Sayfa taşınmış olabilir veya bu ilan artık çalışma alanında erişilebilir değildir.",
    readinessTitle: "Vitrin hazırlığı",
    readinessCopy: "Güçlü profil, alıcının güven kararını hızlandırır.",
    readinessScore: "Hazırlık skoru",
    readinessComplete: "Tamamlandı",
    readinessPending: "Sırada",
    readinessItems: "Kapak görseli,Ses önizlemesi,Lisans açıklaması,Teslim şartları,Yanıt hedefi",
    deliveryBoardTitle: "Teslim panosu",
    deliveryBoardCopy: "Aktif taleplerde sıradaki aksiyonu görünür tutun.",
    deliveryBoardItems: "Proje özeti bekleniyor,Revizyon turu,Final dosya hazırlığı",
    briefBuilderTitle: "Proje özeti",
    briefBuilderCopy:
      "Talebinizi üreticinin hemen anlayacağı kısa ve kullanılır bir proje özetine dönüştürün.",
    briefProject: "Proje tipi",
    briefMood: "Duygu",
    briefUseCase: "Kullanım amacı",
    briefReference: "Referans",
    briefBudget: "Bütçe",
    briefDeadline: "Teslim hedefi",
    briefGenerate: "Özeti önizle",
    briefPreviewTitle: "Hazır özet",
    briefProjectPlaceholder: "Single, EP, reklam müziği...",
    briefMoodPlaceholder: "Karanlık, parlak, kulüp odaklı...",
    briefUseCasePlaceholder: "Single, TikTok, reklam...",
    briefReferencePlaceholder: "Sanatçı, şarkı veya playlist referansı",
    briefBudgetPlaceholder: "250",
    briefDeadlinePlaceholder: "7 gün",
    storefrontInsightTitle: "Jam Alanı içgörüsü",
    storefrontInsightCopy:
      "Hızlı teslim, açık lisans ve güçlü önizleme bir araya geldiğinde alıcının karar vermesi kolaylaşır.",
    bestFor: "En uygun olduğu işler",
    notBestFor: "Uygun olmadığı işler",
    workflow: "Çalışma akışı",
    requirements: "Başlamak için ister",
    creatorFaq: "Kısa cevaplar",
    trustSignals: "Güven sinyalleri",
    repeatBuyerRate: "Tekrar çalışan alıcı",
    responseRate: "Yanıt oranı",
    profileStrength: "Profil gücü",
    deliverables: "Teslim kapsamı",
    filesIncluded: "Dosyalar",
    revisionPolicy: "Revizyon politikası",
    commercialUse: "Ticari kullanım",
    exclusiveAvailable: "Özel lisans uygun",
    available: "Uygun",
    notAvailable: "Uygun değil",
    audioMarkers: "Parça işaretleri",
    audioMarkersHint: "Bölüme hızlı atla",
    mood: "Duygu",
    useCase: "Kullanım amacı",
    deliverySpeed: "Teslim hızı",
    quickCommercial: "Ticari kullanım",
    quickExclusive: "Özel lisans var",
    jamMatchTitle: "Jam Match",
    jamMatchCopy:
      "Brief'e en hızlı oturabilecek işleri; duygu, kullanım amacı, bütçe ve güven sinyallerine göre öne çıkarır.",
    jamMatchBest: "En güçlü eşleşmeler",
    matchScore: "eşleşme",
    matchReasonMood: "Duygu uyumu",
    matchReasonUseCase: "Kullanım amacı uyumu",
    matchReasonTrust: "Güven sinyali yüksek",
    shortlist: "Kısa liste",
    addShortlist: "Kısa listeye ekle",
    removeShortlist: "Kısa listeden çıkar",
    savedToShortlist: "Kısa listede",
    compareQueue: "Karşılaştırma listesi",
    compareQueueHint: "Seçtiğiniz işleri tek bakışta karşılaştırın.",
    emptyShortlist: "Henüz kısa liste yok",
    savedSearches: "Kayıtlı aramalar",
    sentBriefs: "Gönderilen brief",
    pendingReplies: "Bekleyen yanıt",
    listingViews: "Görüntülenme",
    listingSaves: "Kaydetme",
    previewPlays: "Önizleme dinleme",
    conversionRate: "Talep dönüşümü",
    profileTips: "Profil önerileri",
    analytics: "Analitik",
    buyerComparison: "Karşılaştırma",
    buyerComparisonHint: "Fiyat, teslim ve kapsamı hızlı karşılaştırın.",
    selectMood: "Duygu seç",
    selectUseCase: "Kullanım seç",
    selectDelivery: "Teslim seç",
    deliveryInstant: "Anında",
    deliveryFast: "Hızlı",
    deliveryStandard: "Standart",
    language: "Dil",
    currency: "Para birimi",
    currencyUsd: "Amerikan doları",
    currencyTry: "Türk lirası"
  },
  en: {
    navMarketplace: "Jam Place",
    navCreator: "Creator",
    navBuyer: "Buyer",
    navUpload: "Upload",
    navSignIn: "Sign in",
    navDashboard: "Open dashboard",
    searchMarketplace: "Search Jam Place",
    footerText:
      "Jamly MVP. A premium Jam Place for beat licenses, music services, and demo order flows.",
    footerMarketplace: "Jam Place",
    footerUpload: "Upload listing",
    footerAccount: "Create account",
    heroEyebrow: "Beat licenses meet creative services in Jam Place",
    heroTitle: "Jamly",
    heroDescription:
      "License beats, book mix/master services, commission hooks, or request custom production. Jamly brings independent artists and trusted music creators into one premium workflow.",
    heroPrimary: "Explore Jam Place",
    heroSecondary: "Start as a creator",
    statCategories: "Creative categories",
    statCategoriesDetail: "Beats, mixing, mastering, hooks, features",
    statOrderFlow: "Demo order flow",
    statOrderFlowValue: "Ready",
    statOrderFlowDetail: "Payments intentionally out of MVP",
    statSupabase: "Supabase foundation",
    statSupabaseDetail: "Auth, DB schema, and RLS included",
    featuredEyebrow: "Featured work",
    featuredTitle: "Hear the right sound before the session starts.",
    featuredDescription:
      "Every listing gives buyers clearer decision signals: delivery scope, license type, audio preview, and creator context.",
    viewAll: "View all",
    creatorSpotlight: "Creator spotlight",
    openProfile: "Open profile",
    verified: "Verified",
    creatorLabel: "Creator",
    orders: "Orders",
    rating: "Rating",
    workflowEyebrow: "MVP workflow",
    workflowTitle: "Listen, shortlist, request.",
    workflowDescription:
      "The first version is built around discovery, trust, and order intent. Payments, delivery, and messaging can grow from this foundation.",
    workflowPublishTitle: "Creators publish",
    workflowPublishCopy:
      "A beat or service goes live with cover art, audio preview, pricing, license type, BPM, genre, and delivery terms.",
    workflowFilterTitle: "Buyers find the fit",
    workflowFilterCopy:
      "Category, genre, price, delivery speed, and search intent create a cleaner discovery experience.",
    workflowRequestTitle: "Requests become conversations",
    workflowRequestCopy:
      "A demo order request becomes the first touchpoint for briefs, messaging, payments, escrow, and delivery tracking.",
    marketplaceEyebrow: "Jam Place",
    marketplaceTitle: "Find the right sound, service, or collaborator.",
    marketplaceDescription:
      "Compare beat licenses and creative services by preview, scope, turnaround, and creator trust signals.",
    demoListingsReady: "demo listings ready to browse",
    searchPlaceholder: "Search beats, hooks, mixes, or creators",
    all: "All",
    genre: "Genre",
    genrePlaceholder: "R&B, Trap, Pop",
    maxPrice: "Max price",
    reset: "Reset",
    sort: "Sort",
    sortRecommended: "Recommended",
    sortLowPrice: "Low price",
    sortHighPrice: "High price",
    sortNewest: "Newest",
    quickFilters: "Quick filters",
    quickInstant: "Instant delivery",
    quickVerified: "Verified creator",
    quickStems: "Includes stems",
    listingsFound: "listings found",
    marketplaceHint: "Checkout is disabled; requests run in demo mode.",
    noListings: "No matching listings",
    noListingsHint: "Broaden your search or clear quick filters.",
    clearQuickFilters: "Clear filters",
    backMarketplace: "Back to Jam Place",
    startingAt: "Starting at",
    bpmOpen: "Open",
    delivery: "Delivery",
    preview: "Preview",
    streamingUrl: "Streaming URL",
    licenseDelivery: "License and delivery",
    licenseDeliveryCopy:
      "This MVP stores listing metadata, preview URLs, and buyer intent. Payment authorization, license contracts, private file delivery, and dispute handling can layer onto the same order model.",
    published: "Published",
    moreFromCreator: "More from this creator",
    similarItems: "Similar portfolio items",
    requestOrder: "Request order",
    requestSent: "Request sent",
    orderMessage: "Demo order request sent. Payments remain off for this MVP.",
    orderHelp:
      "This only creates a demo order request. Payments, payouts, and file delivery are planned for the next layer.",
    creatorProfileWork: "Browse work",
    respondsIn: "Avg. response",
    ratingSuffix: "rating",
    about: "About",
    completedOrders: "Completed orders",
    averageRating: "Average rating",
    portfolioListings: "Portfolio listings",
    portfolio: "Portfolio",
    beatsServices: "Beats and services",
    creatorDashboardEyebrow: "Creator dashboard",
    creatorDashboardTitle: "Manage your storefront, requests, and delivery rhythm.",
    creatorDashboardDescription:
      "A focused operating surface for creators: listing performance, buyer intent, profile readiness, and next delivery actions.",
    newListing: "New listing",
    activeListings: "Active listings",
    activeListingsDetail: "Across services and beats",
    openRequests: "Open requests",
    demoOrderFlow: "Demo order flow",
    projectedRevenue: "Projected revenue",
    fromDemoRequests: "From demo requests",
    responseTarget: "Response target",
    premiumStandard: "Premium Jam Place standard",
    publishedListings: "Published listings",
    inventoryHint: "Review storefront inventory and buyer-facing scope.",
    orderRequests: "Order requests",
    buyerIntent: "Demo buyer intent.",
    buyer: "Buyer",
    nextBuildTargets: "Next build targets",
    nextBuildTargetItems: "Order-based messaging,Private file delivery,Payments and payout provider,Creator analytics",
    buyerDashboardEyebrow: "Buyer dashboard",
    buyerDashboardTitle: "Track requests and keep your shortlist close.",
    buyerDashboardDescription:
      "A buyer workspace for discovery, brief creation, saved work, and active requests.",
    findTalent: "Find talent",
    savedListings: "Saved listings",
    readyCompare: "Ready to compare",
    avgResponse: "Avg. response",
    spendPreview: "Spend preview",
    noRealPayment: "No real payment captured",
    requestStateOnly: "No checkout yet; only request state is tracked.",
    budgetIntent: "Budget intent",
    savedListingsTitle: "Saved listings",
    shortlistHint: "Shortlisted work for the next session.",
    creatorsToWatch: "Creators to watch",
    uploadEyebrow: "Upload listing",
    uploadTitle: "Publish a beat, service, or custom production offer.",
    uploadDescription:
      "Help buyers decide quickly with clear title, category, genre, BPM, price, description, and license type; upload the audio preview and cover image as files.",
    signInEyebrow: "Welcome back",
    signInTitle: "Sign in to Jamly",
    signInDescription: "Access dashboards, upload listings, and send demo order requests.",
    signUpEyebrow: "Create account",
    signUpTitle: "Join as a creator or buyer",
    signUpDescription:
      "Supabase auth stores your role and creates a profile through the included database trigger.",
    fullName: "Full name",
    handle: "Handle",
    role: "Role",
    email: "Email",
    password: "Password",
    createAccount: "Create account",
    alreadyAccount: "Already have an account?",
    newToJamly: "New to Jamly?",
    liveAuthMissing: "Add Supabase environment variables to enable live auth.",
    supabaseMissing:
      "Supabase is not configured yet. Copy .env.example to .env.local and add your project URL and anon key.",
    signedIn: "Signed in. You can now upload listings or request orders.",
    accountCreated: "Account created. Check your inbox if email confirmation is enabled.",
    authError: "Could not complete action",
    formDemoMode:
      "The form is fully wired, but Supabase credentials are missing. Files run as local previews in this session until .env.local is configured.",
    title: "Title",
    uploadTitlePlaceholder: "Midnight sample pack",
    category: "Category",
    bpm: "BPM",
    optional: "Optional",
    price: "Price",
    audioPreviewUrl: "Audio preview URL",
    coverImageUrl: "Cover image URL",
    audioPreviewFile: "Audio preview file",
    coverImageFile: "Cover image file",
    audioPreviewFileHint: "Upload MP3, WAV, or M4A. Buyers use it as the short listening preview.",
    coverImageFileHint: "Upload JPG, PNG, or WebP. It appears on listing cards and detail pages.",
    chooseFile: "Choose file",
    replaceFile: "Replace file",
    selectedFile: "Selected file",
    mediaReady: "Preview ready",
    missingMediaFiles: "Select both an audio preview and a cover image file.",
    unknownError: "Unknown error",
    licenseType: "License type",
    turnaround: "Turnaround",
    turnaroundPlaceholder: "48 hours",
    description: "Description",
    listingDescriptionPlaceholder:
      "Describe deliverables, revision policy, stems, usage rights, and the buyer this offer fits best.",
    tags: "Tags",
    tagsPlaceholder: "808, topline, stems",
    uploadListing: "Upload listing",
    listingSaved: "Listing uploaded. It will appear after live Jam Place queries are connected.",
    listingStaged: "Demo listing staged locally. Add Supabase credentials to save it.",
    listingError: "Listing could not be saved",
    notFoundTitle: "This drop is not live.",
    notFoundCopy: "The page may have moved, or the listing is no longer available in this demo workspace.",
    readinessTitle: "Storefront readiness",
    readinessCopy: "A strong creator profile directly improves buyer trust.",
    readinessScore: "Readiness score",
    readinessComplete: "Complete",
    readinessPending: "Next",
    readinessItems: "Cover image,Audio preview,License language,Delivery terms,Response target",
    deliveryBoardTitle: "Delivery board",
    deliveryBoardCopy: "Clarify the next action for active requests.",
    deliveryBoardItems: "Waiting for brief,Revision round,Final file prep",
    briefBuilderTitle: "Brief builder",
    briefBuilderCopy:
      "Create a short but useful creative brief so requests arrive with clearer intent.",
    briefProject: "Project type",
    briefMood: "Mood",
    briefUseCase: "Use case",
    briefReference: "Reference",
    briefBudget: "Budget",
    briefDeadline: "Delivery target",
    briefGenerate: "Preview brief",
    briefPreviewTitle: "Ready brief",
    briefProjectPlaceholder: "Single, EP, ad music...",
    briefMoodPlaceholder: "Dark, bright, club-focused...",
    briefUseCasePlaceholder: "Single, TikTok, ad...",
    briefReferencePlaceholder: "Artist, song, or playlist reference",
    briefBudgetPlaceholder: "250",
    briefDeadlinePlaceholder: "7 days",
    storefrontInsightTitle: "Jam Place insight",
    storefrontInsightCopy:
      "Fast delivery, clear licensing, and strong previews raise buyer conversion.",
    bestFor: "Best for",
    notBestFor: "Not ideal for",
    workflow: "Workflow",
    requirements: "Needs to start",
    creatorFaq: "Quick answers",
    trustSignals: "Trust signals",
    repeatBuyerRate: "Repeat buyers",
    responseRate: "Response rate",
    profileStrength: "Profile strength",
    deliverables: "Deliverables",
    filesIncluded: "Files included",
    revisionPolicy: "Revision policy",
    commercialUse: "Commercial use",
    exclusiveAvailable: "Exclusive available",
    available: "Available",
    notAvailable: "Not available",
    audioMarkers: "Track markers",
    audioMarkersHint: "Jump to a section",
    mood: "Mood",
    useCase: "Use case",
    deliverySpeed: "Delivery speed",
    quickCommercial: "Commercial use",
    quickExclusive: "Exclusive available",
    jamMatchTitle: "Jam Match",
    jamMatchCopy:
      "Highlights the fastest-fit work for a brief by mood, use case, budget, and trust signals.",
    jamMatchBest: "Best matches",
    matchScore: "match",
    matchReasonMood: "Mood fit",
    matchReasonUseCase: "Use-case fit",
    matchReasonTrust: "Strong trust signal",
    shortlist: "Shortlist",
    addShortlist: "Add to shortlist",
    removeShortlist: "Remove from shortlist",
    savedToShortlist: "Shortlisted",
    compareQueue: "Compare queue",
    compareQueueHint: "Compare selected work at a glance.",
    emptyShortlist: "No shortlist yet",
    savedSearches: "Saved searches",
    sentBriefs: "Sent briefs",
    pendingReplies: "Pending replies",
    listingViews: "Views",
    listingSaves: "Saves",
    previewPlays: "Preview plays",
    conversionRate: "Request conversion",
    profileTips: "Profile tips",
    analytics: "Analytics",
    buyerComparison: "Comparison",
    buyerComparisonHint: "Compare price, delivery, and scope quickly.",
    selectMood: "Select mood",
    selectUseCase: "Select use case",
    selectDelivery: "Select delivery",
    deliveryInstant: "Instant",
    deliveryFast: "Fast",
    deliveryStandard: "Standard",
    language: "Language",
    currency: "Currency",
    currencyUsd: "US dollar",
    currencyTry: "Turkish lira"
  }
} as const;

export type MessageKey = keyof typeof messages.en;

export function getMessage(language: Language, key: MessageKey) {
  return messages[language][key] ?? messages.en[key];
}

export function splitMessageList(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

type CreatorCopy = Pick<
  Creator,
  | "headline"
  | "responseTime"
  | "specialties"
  | "about"
  | "bestFor"
  | "notBestFor"
  | "workflow"
  | "requirements"
  | "faq"
>;
type ListingCopy = Pick<
  Listing,
  | "title"
  | "genre"
  | "description"
  | "turnaround"
  | "tags"
  | "deliverables"
  | "filesIncluded"
  | "revisionPolicy"
  | "markers"
>;

const creatorCopies: Record<string, Record<Language, CreatorCopy>> = {
  "creator-mira": {
    tr: {
      headline: "Parlak pop prodüksiyonu, güçlü hook ve vokal düzeni",
      responseTime: "1 saat",
      specialties: ["Alt pop", "Vokal prodüksiyon", "Hook yazımı"],
      about:
        "Mira, bağımsız sanatçıların tavrını törpülemeden şarkıyı daha büyük, daha temiz ve yayına hazır hissettiren prodüksiyonlar kurar.",
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
      ]
    },
    en: {
      headline: "Major-label pop production and vocal architecture",
      responseTime: "1 hour",
      specialties: ["Alt pop", "Vocal production", "Hooks"],
      about:
        "Mira builds glossy, release-ready records for independent artists who want major-label finish without losing their own edge.",
      bestFor: ["Pop singles", "Hook direction", "Vocal production"],
      notBestFor: ["Same-day delivery", "Beat lease catalog"],
      workflow: ["Reviews references", "Maps the hook direction", "Delivers demo vocal and lyric file"],
      requirements: ["Beat or demo link", "Reference song", "Lyric direction or theme"],
      faq: [
        {
          question: "Are revisions included?",
          answer: "One melody/lyric revision round is included; scope is confirmed before recording."
        },
        {
          question: "Do I get vocal stems?",
          answer: "Dry demo vocal, harmony references, and a lyric file are delivered."
        }
      ]
    }
  },
  "creator-kairo": {
    tr: {
      headline: "Trap, R&B ve drill için temiz stemli prodüksiyon",
      responseTime: "2 saat",
      specialties: ["Trap", "R&B", "Drill"],
      about:
        "Kairo, yazım seansına hızlı oturan beat paketleri üretir; ayrılmış stemler, aranjman notları ve açık lisans diliyle teslimi sürprizsiz tutar.",
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
      ]
    },
    en: {
      headline: "Trap, R&B, and cinematic drill production with clean stems",
      responseTime: "2 hours",
      specialties: ["Trap", "R&B", "Drill"],
      about:
        "Kairo sells polished beat packs and custom production with separated stems, arrangement notes, and buyer-friendly licensing.",
      bestFor: ["Trap/R&B singles", "Tracked-out beats", "Custom drill production"],
      notBestFor: ["Acoustic tracking", "Live band arrangement"],
      workflow: ["Locks reference and BPM", "Chooses beat direction", "Delivers stem and license package"],
      requirements: ["Reference track", "Vocal tone or artist example", "License use case"],
      faq: [
        {
          question: "Are trackout stems included?",
          answer: "Premium and exclusive licenses include WAV, MP3, and trackout stems."
        },
        {
          question: "Can I commission a custom beat?",
          answer: "Yes, open a custom production request with a short brief and two references."
        }
      ]
    }
  },
  "creator-sola": {
    tr: {
      headline: "Vokali öne alan, low-end'i kontrollü tutan miks mühendisi",
      responseTime: "3 saat",
      specialties: ["Miks", "Mastering", "Vokal zincirleri"],
      about:
        "Sola, vokalin sözünü kaybettirmeyen, davulu taşıyan ve streaming master'ı sertleşmeden güçlü duyuran mikslerde uzmanlaşır.",
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
      ]
    },
    en: {
      headline: "Mix engineer for intimate vocals and heavy low end",
      responseTime: "3 hours",
      specialties: ["Mixing", "Mastering", "Vocal chains"],
      about:
        "Sola specializes in mixes that keep vocals close, drums intentional, and streaming masters loud without getting harsh.",
      bestFor: ["Vocal-forward mixes", "Streaming masters", "Low-end control"],
      notBestFor: ["Rescuing missing recordings", "Production from scratch"],
      workflow: ["Checks stems", "Builds first mix pass", "Applies revision notes"],
      requirements: ["Dry vocal stems", "Beat/instrumental", "Master reference"],
      faq: [
        {
          question: "How many revisions are included?",
          answer: "Mix packages include two rounds; mastering includes one round."
        },
        {
          question: "What formats are delivered?",
          answer: "Final WAV, MP3, and optional instrumental/acapella exports are prepared."
        }
      ]
    }
  }
};

const listingCopies: Record<string, Record<Language, ListingCopy>> = {
  "night-shift-bounce": {
    tr: {
      title: "Night Shift Bounce",
      genre: "Trap Soul",
      description:
        "Gece yarısı hissi veren trap soul beat: geniş padler, kontrollü 808 yürüyüşü ve hook'a bilinçli boşluk bırakan aranjman. Premium lisansta WAV, MP3 ve track-out stemler dahildir.",
      turnaround: "Anında teslim",
      tags: ["Karanlık", "808", "Melodik", "Stem"],
      deliverables: ["WAV + MP3", "Trackout stem", "Lisans özeti"],
      filesIncluded: ["WAV", "MP3", "Trackouts"],
      revisionPolicy: "Beat lisansında revizyon yok; özel düzenleme ayrı talep edilir.",
      markers: [
        { label: "Intro", time: 0 },
        { label: "Hook", time: 39 },
        { label: "Verse", time: 75 }
      ]
    },
    en: {
      title: "Night Shift Bounce",
      genre: "Trap Soul",
      description:
        "A moody trap soul beat with spacious keys, clean 808 movement, and a hook-ready arrangement. Includes WAV, MP3, and tracked-out stems on premium licenses.",
      turnaround: "Instant delivery",
      tags: ["Dark", "808", "Melodic", "Stems"],
      deliverables: ["WAV + MP3", "Trackout stems", "License summary"],
      filesIncluded: ["WAV", "MP3", "Trackouts"],
      revisionPolicy: "Beat licenses do not include revisions; custom arrangement is requested separately.",
      markers: [
        { label: "Intro", time: 0 },
        { label: "Hook", time: 39 },
        { label: "Verse", time: 75 }
      ]
    }
  },
  "velvet-hook-package": {
    tr: {
      title: "Velvet Hook Paketi",
      genre: "Pop",
      description:
        "Topline melodi, söz dosyası, dry vokal demo ve referans armonilerle özel nakarat yazımı. Verse fikri veya beat yönü belli olan sanatçının şarkıyı hızlıca kilitlemesi için tasarlandı.",
      turnaround: "3 gün",
      tags: ["Topline", "Referans vokal", "Pop", "Söz"],
      deliverables: ["Topline melodi", "Söz dosyası", "Dry demo vokal"],
      filesIncluded: ["Söz PDF", "Demo WAV", "Armoni referansları"],
      revisionPolicy: "Bir hook yönü revizyonu dahildir.",
      markers: [
        { label: "Hook fikri", time: 24 },
        { label: "Armoni", time: 58 },
        { label: "Outro", time: 92 }
      ]
    },
    en: {
      title: "Velvet Hook Package",
      genre: "Pop",
      description:
        "Custom chorus writing with topline melody, lyric sheet, dry vocal demo, and reference harmony stack. Built for artists who already have a verse or beat direction.",
      turnaround: "3 days",
      tags: ["Topline", "Demo vocal", "Pop", "Lyrics"],
      deliverables: ["Topline melody", "Lyric file", "Dry demo vocal"],
      filesIncluded: ["Lyrics PDF", "Demo WAV", "Harmony refs"],
      revisionPolicy: "One hook-direction revision is included.",
      markers: [
        { label: "Hook idea", time: 24 },
        { label: "Harmony", time: 58 },
        { label: "Outro", time: 92 }
      ]
    }
  },
  "club-ready-mix": {
    tr: {
      title: "Club Ready Mix",
      genre: "Hip-Hop",
      description:
        "48 steme kadar tek şarkı için tam miks: vokal temizliği, alan efektleri, miks notları ve iki revizyon turu. Teslim paketinde final WAV ve instrumental versiyon bulunur.",
      turnaround: "5 gün",
      tags: ["Miks", "Vokal", "Revizyon", "Stem"],
      deliverables: ["Tam miks", "Instrumental çıktı", "İki revizyon"],
      filesIncluded: ["Final WAV", "MP3", "Instrumental"],
      revisionPolicy: "İki not turu dahildir; yeni kayıt ekleme ayrı kapsama girer.",
      markers: [
        { label: "Önce", time: 0 },
        { label: "Vokal lift", time: 42 },
        { label: "Drop", time: 86 }
      ]
    },
    en: {
      title: "Club Ready Mix",
      genre: "Hip-Hop",
      description:
        "Full mix for one song up to 48 stems with vocal tuning cleanup, spatial effects, mix notes, and two revision rounds. Delivery includes WAV and instrumental.",
      turnaround: "5 days",
      tags: ["Mix", "Vocals", "Revisions", "Stems"],
      deliverables: ["Full mix", "Instrumental export", "Two revisions"],
      filesIncluded: ["Final WAV", "MP3", "Instrumental"],
      revisionPolicy: "Two note rounds are included; adding new recordings is a new scope.",
      markers: [
        { label: "Before", time: 0 },
        { label: "Vocal lift", time: 42 },
        { label: "Drop", time: 86 }
      ]
    }
  },
  "miami-sunrise-pack": {
    tr: {
      title: "Miami Sunrise Pack",
      genre: "Afrobeats",
      description:
        "Sıcak bas, parlak akorlar ve perküsif geçişlerle dans pistine hazır üç Afrobeats loop'u. Hızlı yazım seansları, reklam proje özetleri veya özel beat genişletmeleri için güçlü başlangıç.",
      turnaround: "Anında teslim",
      tags: ["Afrobeats", "Loop", "Yaz", "Bounce"],
      deliverables: ["3 loop", "MP3 önizleme", "Temel lisans"],
      filesIncluded: ["WAV loop", "MP3 referans"],
      revisionPolicy: "Loop paketlerinde revizyon yok; custom genişletme ayrı talep edilir.",
      markers: [
        { label: "Loop A", time: 0 },
        { label: "Loop B", time: 36 },
        { label: "Bridge", time: 72 }
      ]
    },
    en: {
      title: "Miami Sunrise Pack",
      genre: "Afrobeats",
      description:
        "Three bright, dancefloor-ready loops with bounce, bass, and percussive switch-ups. Great for quick writing sessions or custom beat expansion.",
      turnaround: "Instant delivery",
      tags: ["Afrobeats", "Loops", "Summer", "Bounce"],
      deliverables: ["3 loops", "MP3 preview", "Basic lease"],
      filesIncluded: ["WAV loops", "MP3 refs"],
      revisionPolicy: "Loop packs do not include revisions; custom expansion is requested separately.",
      markers: [
        { label: "Loop A", time: 0 },
        { label: "Loop B", time: 36 },
        { label: "Bridge", time: 72 }
      ]
    }
  },
  "private-vocal-feature": {
    tr: {
      title: "Özel Vokal Katkı",
      genre: "Indie Pop",
      description:
        "Single'ınız için lead vokal, double, armoni ve dry/wet stemlerle temiz bir vokal katkı. Kullanım hakkı ve yayın kapsamı kayıt başlamadan netleştirilir.",
      turnaround: "7 gün",
      tags: ["Vokal katkı", "Armoni", "Indie", "Stem"],
      deliverables: ["Lead vokal", "Double", "Dry/wet stem"],
      filesIncluded: ["Lead WAV", "Armoni WAV", "Wet referans"],
      revisionPolicy: "Bir performans notu turu dahildir; söz değişimi yeni kapsam sayılır.",
      markers: [
        { label: "Lead", time: 18 },
        { label: "Stack", time: 54 },
        { label: "Ad-lib", time: 110 }
      ]
    },
    en: {
      title: "Private Vocal Feature",
      genre: "Indie Pop",
      description:
        "A clean vocal feature for your single with lead vocal, doubles, harmonies, and dry plus wet stems. Usage terms are agreed before recording starts.",
      turnaround: "7 days",
      tags: ["Feature", "Harmony", "Indie", "Stems"],
      deliverables: ["Lead vocal", "Doubles", "Dry/wet stems"],
      filesIncluded: ["Lead WAV", "Harmony WAV", "Wet refs"],
      revisionPolicy: "One performance-note round is included; lyric changes are a new scope.",
      markers: [
        { label: "Lead", time: 18 },
        { label: "Stack", time: 54 },
        { label: "Ad-lib", time: 110 }
      ]
    }
  },
  "streaming-master": {
    tr: {
      title: "Streaming Master",
      genre: "Tüm türler",
      description:
        "Spotify, Apple Music, YouTube ve sosyal platformlarda dengeli duyulacak odaklı master. Loudness hedef notları, WAV, MP3 ve bir revizyon turu dahildir.",
      turnaround: "48 saat",
      tags: ["Mastering", "Loudness", "Yayına hazır"],
      deliverables: ["Streaming master", "Loudness notu", "Bir revizyon"],
      filesIncluded: ["Master WAV", "MP3", "Loudness notları"],
      revisionPolicy: "Bir master revizyonu dahildir; yeni miks dosyası yeni pass sayılır.",
      markers: [
        { label: "A/B", time: 0 },
        { label: "Low end", time: 44 },
        { label: "Final lift", time: 96 }
      ]
    },
    en: {
      title: "Streaming Master",
      genre: "Any Genre",
      description:
        "A focused master for Spotify, Apple Music, YouTube, and socials. Includes loudness target notes, WAV, MP3, and one revision pass.",
      turnaround: "48 hours",
      tags: ["Mastering", "Loudness", "Release-ready"],
      deliverables: ["Streaming master", "Loudness note", "One revision"],
      filesIncluded: ["Master WAV", "MP3", "Loudness notes"],
      revisionPolicy: "One master revision is included; a new mix file counts as a new pass.",
      markers: [
        { label: "A/B", time: 0 },
        { label: "Low end", time: 44 },
        { label: "Final lift", time: 96 }
      ]
    }
  }
};

export function localizeCreator(creator: Creator, language: Language): Creator {
  const copy = creatorCopies[creator.id]?.[language];
  return copy ? { ...creator, ...copy } : creator;
}

export function localizeListing(listing: Listing, language: Language): Listing {
  const copy = listingCopies[listing.id]?.[language];
  return copy ? { ...listing, ...copy } : listing;
}

export function localizeOrder(order: OrderRequest, language: Language): OrderRequest {
  const copy = listingCopies[order.listingId]?.[language];
  return copy ? { ...order, listingTitle: copy.title } : order;
}

export function categoryLabel(category: ListingCategory, language: Language) {
  const labels: Record<Language, Record<ListingCategory, string>> = {
    tr: {
      Beat: "Beat",
      Mixing: "Miks",
      Mastering: "Mastering",
      Songwriting: "Şarkı Yazımı",
      "Vocal Feature": "Vokal Katkı",
      "Custom Production": "Özel Prodüksiyon"
    },
    en: {
      Beat: "Beat",
      Mixing: "Mixing",
      Mastering: "Mastering",
      Songwriting: "Songwriting",
      "Vocal Feature": "Vocal Feature",
      "Custom Production": "Custom Production"
    }
  };

  return labels[language][category];
}

export function licenseLabel(license: LicenseType, language: Language) {
  const labels: Record<Language, Record<LicenseType, string>> = {
    tr: {
      "Basic Lease": "Temel Lisans",
      "Premium Lease": "Premium Lisans",
      Exclusive: "Özel Lisans",
      Service: "Hizmet"
    },
    en: {
      "Basic Lease": "Basic Lease",
      "Premium Lease": "Premium Lease",
      Exclusive: "Exclusive",
      Service: "Service"
    }
  };

  return labels[language][license];
}

export function orderStatusLabel(status: OrderRequest["status"], language: Language) {
  const labels: Record<Language, Record<OrderRequest["status"], string>> = {
    tr: {
      Draft: "Taslak",
      Requested: "Talep Edildi",
      "In Review": "İncelemede",
      Delivered: "Teslim Edildi"
    },
    en: {
      Draft: "Draft",
      Requested: "Requested",
      "In Review": "In Review",
      Delivered: "Delivered"
    }
  };

  return labels[language][status];
}

export function roleLabel(role: Role, language: Language) {
  const labels: Record<Language, Record<Role, string>> = {
    tr: {
      buyer: "Alıcı",
      creator: "Üretici"
    },
    en: {
      buyer: "Buyer",
      creator: "Creator"
    }
  };

  return labels[language][role];
}

export function moodLabel(mood: ListingMood, language: Language) {
  const labels: Record<Language, Record<ListingMood, string>> = {
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
  };

  return labels[language][mood];
}

export function usageLabel(useCase: ListingUseCase, language: Language) {
  const labels: Record<Language, Record<ListingUseCase, string>> = {
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
  };

  return labels[language][useCase];
}

export function deliverySpeedLabel(deliverySpeed: DeliverySpeed, language: Language) {
  const labels: Record<Language, Record<DeliverySpeed, string>> = {
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
  };

  return labels[language][deliverySpeed];
}

export function localizedGenres(language: Language) {
  return language === "tr"
    ? ["Trap Soul", "Pop", "Hip-Hop", "Afrobeats", "Indie Pop", "Tüm türler"]
    : ["Trap Soul", "Pop", "Hip-Hop", "Afrobeats", "Indie Pop", "Any Genre"];
}
