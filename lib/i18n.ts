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
    navMessages: "Mesajlar",
    navCreator: "Üretici",
    navBuyer: "Alıcı",
    navUpload: "İş yayınla",
    navSignIn: "Giriş yap",
    navProfile: "Profilim",
    navDashboard: "Paneli aç",
    accountMenu: "Hesap menüsü",
    signOut: "Çıkış yap",
    openMenu: "Menüyü aç",
    closeMenu: "Menüyü kapat",
    mobileNavigation: "Mobil navigasyon",
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
    noLiveListingsCopy: "Henüz canlı ilan yok. Üreticiler yeni işler yayınladığında burada görünecek.",
    clearQuickFilters: "Filtreleri temizle",
    backMarketplace: "Jam Alanı'na dön",
    startingAt: "Başlangıç fiyatı",
    threeLicenseOptions: "3 lisans seçeneği",
    compareLicenses: "Lisansları karşılaştır ve satın al",
    bpmOpen: "Serbest",
    delivery: "Teslim",
    preview: "Önizleme",
    streamingUrl: "Dinleme bağlantısı",
    licenseDelivery: "Lisans ve teslim",
    licenseDeliveryCopy:
      "Beat ilanlarında lisans şartları sabittir; üretici yalnızca üç tier fiyatını belirler. Satın alınan tier'ın private paketi sipariş sayfasında güvenli indirme bağlantısıyla teslim edilir.",
    published: "Yayınlandı",
    moreFromCreator: "Üreticiden diğer işler",
    similarItems: "Benzer portföy işleri",
    requestOrder: "Sipariş talep et",
    requestSent: "Talep gönderildi",
    orderMessage: "Talebiniz üreticiye kaydedildi. Sipariş sayfasından konuşmayı sürdürebilirsiniz.",
    orderRequestError: "Talep kaydedilemedi",
    signInToRequest: "Talep göndermek için giriş yap",
    demoOrderOnly: "Bu örnek ilan demo verisidir; veritabanına sipariş kaydı oluşturulmaz.",
    buyerOnlyOrder: "Sipariş talebi göndermek için giriş yapmanız gerekir.",
    ownListingOrderBlocked: "Kendi ilanınız için sipariş talebi gönderemezsiniz.",
    orderHelp:
      "Bu buton yalnızca ön talep oluşturur. Ödeme, üretici ödemesi ve dosya teslimi sonraki geliştirme katmanında açılacak.",
    messageArtist: "Üreticiye mesaj gönder",
    requestOffer: "Teklif iste",
    startingConversation: "Konuşma açılıyor...",
    conversationStartError: "Konuşma başlatılamadı",
    buyerOnlyMessaging: "Konuşma başlatmak için giriş yapmanız gerekir.",
    messagesEyebrow: "Jamly mesajları",
    messagesTitle: "Projeyi konuşmaya taşı.",
    messagesDescription:
      "İlan ayrıntılarını, özel teklifleri ve proje kararlarını üreticiyle aynı konuşmada tut.",
    conversations: "Konuşmalar",
    searchConversations: "Konuşmalarda ara",
    noConversations: "Henüz konuşma yok",
    noConversationsCopy: "Bir ilan veya üretici profilinden mesaj göndererek ilk konuşmayı başlat.",
    selectConversation: "Bir konuşma seç",
    selectConversationCopy: "Mesajları ve proje bağlamını burada görmek için soldan bir konuşma aç.",
    relatedListing: "İlgili ilan",
    backToConversations: "Konuşmalara dön",
    messagesLoading: "Konuşmalar yükleniyor...",
    messagesSignInTitle: "Mesajlarını görmek için giriş yap",
    messagesSignInCopy: "Canlı konuşmalar yalnızca ilgili alıcı ve üretici hesabına görünür.",
    demoMessages: "Demo konuşmaları",
    unreadMessages: "okunmamış mesaj",
    typeMessage: "Mesajını yaz...",
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
    accountDashboardEyebrow: "Hesap paneli",
    accountDashboardTitle: "Tek hesapla hem keşfedin hem satış vitrininizi yönetin.",
    accountDashboardDescription:
      "Jamly hesabınız alım ve satış akışlarını ayırmaz. İsterseniz üretici bulup talep açın, isterseniz aynı hesaptan ilan yayınlayın.",
    profileStorefront: "Profil vitrini",
    sellerRequests: "Satış tarafı",
    buyerWorkspace: "Alım tarafı",
    sellerModeTitle: "Satış vitrini",
    sellerModeCopy:
      "Yayınladığınız beatleri, hizmetleri, lisans fiyatlarını, talepleri ve profil güven sinyallerini yönetin.",
    buyerModeTitle: "Alım çalışma alanı",
    buyerModeCopy:
      "Kısa listenizi, proje özetlerinizi, açık taleplerinizi ve konuşmalarınızı tek yerden takip edin.",
    openSellerWorkspace: "Satış alanını aç",
    openBuyerWorkspace: "Alım alanını aç",
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
    nextBuildTargetItems: "Hizmet teslim alanı,Özel teklif oluşturma,Ödeme ve üretici ödemeleri,Üretici analitiği",
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
      "Beat ilanlarında üç sabit lisans fiyatını ve private teslim paketlerini hazırlayın; hizmet ilanlarında kapsamı ve tek fiyatı netleştirin.",
    signInEyebrow: "Tekrar hoş geldiniz",
    signInTitle: "Jamly hesabınıza giriş yapın",
    signInDescription: "Panellerinize dönün, işleri yönetin ve taleplerinizi takip edin.",
    signUpEyebrow: "Hesap oluştur",
    signUpTitle: "Jamly hesabınızı oluşturun",
    signUpDescription:
      "Tek hesapla üretici bulabilir, proje talebi açabilir veya kendi müzik işlerinizi satışa koyabilirsiniz.",
    fullName: "Ad soyad",
    handle: "Kullanıcı adı",
    role: "Rol",
    email: "E-posta",
    password: "Şifre",
    createAccount: "Hesap oluştur",
    alreadyAccount: "Zaten hesabınız var mı?",
    newToJamly: "Jamly'de yeni misiniz?",
    liveAuthMissing: "Canlı hesap açma ve giriş için Supabase bağlantısı gerekir. Demo modda siteyi giriş yapmadan inceleyebilirsiniz.",
    authDemoMode:
      "Demo önizleme modu açık. Jamly ekranlarını giriş yapmadan inceleyebilirsiniz; canlı hesap açma Supabase bağlanınca aktif olur.",
    supabaseMissing:
      "Demo önizleme modu açık. Canlı hesap, ilan ve mesaj kayıtları Supabase bağlantısı yapılınca aktif olur.",
    supabaseInvalidConfig:
      "Canlı Supabase bağlantısı henüz tamamlanmadı. Project URL, publishable key ve veritabanı şeması hazır olana kadar Jamly demo verilerle çalışır.",
    signedIn: "Giriş yapıldı. Artık iş yayınlayabilir veya sipariş talep edebilirsiniz.",
    accountCreated: "Hesap oluşturuldu. E-posta doğrulaması açıksa gelen kutunuzu kontrol edin.",
    authError: "İşlem tamamlanamadı",
    profileMissing: "Hesap profili bulunamadı. Lütfen tekrar giriş yapın.",
    checkingAccount: "Hesabınız kontrol ediliyor...",
    uploadSignInTitle: "İlan yayınlamak için giriş yapın",
    uploadSignInCopy: "Jamly, ilanları doğru hesaba bağlamak için oturum açmanızı ister.",
    creatorOnlyTitle: "İlan yayınlamak için giriş yapın",
    creatorOnlyCopy: "Tek Jamly hesabınızla hem alım yapabilir hem satış vitrininizi oluşturabilirsiniz.",
    creatorSessionRequired: "İlanı kaydetmek için doğrulanmış bir oturum gerekir.",
    dashboardLoading: "Çalışma alanınız hazırlanıyor...",
    dashboardErrorTitle: "Çalışma alanı yüklenemedi",
    dashboardRetry: "Tekrar dene",
    dashboardSignInTitle: "Panelinizi görmek için giriş yapın",
    dashboardSignInCopy: "İlanlarınız ve sipariş talepleriniz hesabınıza özel olarak gösterilir.",
    wrongDashboardTitle: "Bu panel diğer hesap rolüne ait",
    wrongDashboardCreator: "Üretici hesabınız için üretici panelini açın.",
    wrongDashboardBuyer: "Alıcı hesabınız için alıcı panelini açın.",
    openCorrectDashboard: "Doğru paneli aç",
    noCreatorListings: "Henüz yayınlanmış ilanınız yok.",
    noCreatorListingsCopy: "İlk beat veya müzik hizmetinizi yayınlayarak vitrininizi oluşturun.",
    noOrderRequests: "Henüz sipariş talebi yok.",
    noOrderRequestsCopy: "Yeni talepler geldiğinde burada görünecek ve sipariş konuşmasına dönüşecek.",
    liveData: "Canlı hesap verisi",
    demoData: "Demo önizleme verisi",
    orderDetailEyebrow: "Sipariş çalışma alanı",
    orderDetailTitle: "Proje özeti ve konuşma",
    orderBrief: "Proje özeti",
    orderStatus: "Sipariş durumu",
    orderConversation: "Mesajlar",
    orderConversationCopy: "Proje kararlarını ve sonraki adımları sipariş içinde kayıtlı tutun.",
    noMessages: "Henüz mesaj yok. Projenin ilk ayrıntısını paylaşarak konuşmayı başlatın.",
    messagePlaceholder: "Proje, referans veya teslim beklentisi hakkında yazın...",
    sendMessage: "Mesaj gönder",
    messageError: "Mesaj gönderilemedi",
    orderNotAvailable: "Bu sipariş bulunamadı veya görüntüleme yetkiniz yok.",
    orderSignInCopy: "Sipariş ayrıntıları yalnızca alıcı ve üretici tarafından görülebilir.",
    backToDashboard: "Panele dön",
    projectValue: "Proje bütçesi",
    participantBuyer: "Alıcı",
    participantCreator: "Üretici",
    noBriefProvided: "Talep oluşturulurken ek bir proje özeti paylaşılmadı.",
    creatorNotFound: "Bu üretici profili bulunamadı.",
    formDemoMode:
      "Demo önizleme modu açık. Formu ve dosya seçimlerini deneyebilirsiniz; canlı Supabase bağlandığında ilanlar hesaba kaydedilir.",
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
    invalidLicensePrices: "Üç lisans fiyatı da 0'dan büyük olmalıdır.",
    missingLicenseFiles: "MP3, Unlimited ZIP ve Exclusive ZIP teslim paketlerini seçin.",
    invalidServicePrice: "Hizmet fiyatı 0'dan büyük olmalıdır.",
    unknownError: "Bilinmeyen hata",
    licenseType: "Lisans tipi",
    beatLicensePricing: "Sabit lisans yapısı",
    setThreeLicensePrices: "Her lisans için satış fiyatını belirleyin",
    pricesStoredInUsd: "Fiyatı seçili para biriminde girin; Jamly arka planda USD tabanına çevirir.",
    priceCurrencyHint: "Şu an fiyat girişi",
    convertedPriceHint: "Yaklaşık USD karşılığı",
    listingBasicsStep: "1. İlan temeli",
    listingBasicsCopy: "Alıcıların aramada hızlı anlayacağı başlık, kategori ve tür bilgisini girin.",
    listingMediaStep: "2. Önizleme medyası",
    listingMediaCopy: "Kısa ses önizlemesi ve net bir kapak görseli ilan kalitesini doğrudan artırır.",
    listingDeliveryStep: "3. Fiyat ve teslimat",
    listingDeliveryCopy: "Seçili para birimine göre fiyat girin; alıcılar kendi para biriminde görür.",
    licenseDeliveryPackages: "Private teslim paketleri",
    uploadBuyerFiles: "Alıcının satın alma sonrası indireceği dosyaları yükleyin",
    privateDeliveryFilesHint:
      "Bu dosyalar public değildir. Yalnızca üretici ve ilgili lisansı satın alan alıcı kısa ömürlü güvenli bağlantıyla erişebilir.",
    deliveryMp3Hint: "MP3 lisansı için temiz, teslim edilebilir .mp3 dosyası.",
    deliveryUnlimitedHint: "WAV, MP3 ve trackout dosyalarını içeren tek .zip paketi.",
    deliveryExclusiveHint: "Tüm dosyaları ve varsa proje dosyasını içeren tek .zip paketi.",
    deliveryReady: "Teslim hazır",
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
    checkoutEyebrow: "Beat lisansı",
    checkoutTitle: "Projeniz için doğru lisansı seçin.",
    checkoutDescription:
      "Dosya kapsamını ve kullanım şartlarını karşılaştırın. Lisans metni sabittir; fiyatı üretici belirler.",
    chooseLicense: "Lisans seç",
    selectedLicense: "Seçilen lisans",
    includedFiles: "Teslim dosyaları",
    licenseTerms: "Kullanım şartları",
    orderTotal: "Toplam",
    purchaseLicense: "Lisans siparişini tamamla",
    completingPurchase: "Lisans kaydediliyor...",
    demoCheckoutNotice:
      "Demo modundasınız. Lisansları karşılaştırabilirsiniz; satın alma veritabanına kaydedilmez.",
    livePurchaseRequiresAuth: "Satın alma için Jamly hesabınızla giriş yapın.",
    checkoutBuyerOnly: "Lisans satın almak için giriş yapmanız gerekir.",
    ownListingPurchaseBlocked: "Kendi ilanınız için lisans satın alamazsınız.",
    checkoutUnavailable: "Bu beat için lisans satışı şu anda kullanılamıyor.",
    exclusiveSoldTitle: "Exclusive Satıldı",
    exclusiveSoldCopy:
      "Bu beat exclusive olarak satıldı. İlan kapanmıştır ve yeni lisans satın alınamaz.",
    exclusiveRemovesListing: "Satın alındığında ilan Jam Alanı'ndan kaldırılır.",
    mockPurchaseComplete: "Demo lisans seçimi tamamlandı",
    mockPurchaseCopy: "Canlı Supabase bağlantısında bu işlem siparişi kaydeder ve teslim paketini açar.",
    backToListing: "İlana dön",
    purchaseFailed: "Lisans siparişi tamamlanamadı",
    licensePurchaseRecorded: "Lisans siparişi kaydedildi. Teslim paketiniz sipariş sayfasında hazır.",
    viewOrder: "Siparişi ve teslimatı aç",
    licensePurchased: "Satın alınan lisans",
    licenseVersion: "Lisans şablonu",
    deliveryPackage: "Güvenli teslim paketi",
    downloadPackage: "Teslim paketini indir",
    preparingDownload: "Güvenli bağlantı hazırlanıyor...",
    deliveryUnavailable: "Bu sipariş için teslim paketi henüz hazır değil.",
    downloadError: "Teslim paketi indirilemedi",
    exclusiveSold: "Exclusive Satıldı",
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
    navMessages: "Messages",
    navCreator: "Creator",
    navBuyer: "Buyer",
    navUpload: "Upload",
    navSignIn: "Sign in",
    navProfile: "My profile",
    navDashboard: "Open dashboard",
    accountMenu: "Account menu",
    signOut: "Sign out",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    mobileNavigation: "Mobile navigation",
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
    noLiveListingsCopy: "There are no live listings yet. New creator work will appear here.",
    clearQuickFilters: "Clear filters",
    backMarketplace: "Back to Jam Place",
    startingAt: "Starting at",
    threeLicenseOptions: "3 license options",
    compareLicenses: "Compare licenses and purchase",
    bpmOpen: "Open",
    delivery: "Delivery",
    preview: "Preview",
    streamingUrl: "Streaming URL",
    licenseDelivery: "License and delivery",
    licenseDeliveryCopy:
      "Beat license terms are fixed while creators control the three tier prices. The purchased tier's private package is delivered through a secure order-page download link.",
    published: "Published",
    moreFromCreator: "More from this creator",
    similarItems: "Similar portfolio items",
    requestOrder: "Request order",
    requestSent: "Request sent",
    orderMessage: "Your request was saved for the creator. Continue the conversation from the order page.",
    orderRequestError: "Could not save request",
    signInToRequest: "Sign in to request",
    demoOrderOnly: "This is a demo listing, so no order is written to the database.",
    buyerOnlyOrder: "Sign in to send an order request.",
    ownListingOrderBlocked: "You cannot request an order on your own listing.",
    orderHelp:
      "This only creates a demo order request. Payments, payouts, and file delivery are planned for the next layer.",
    messageArtist: "Message Artist",
    requestOffer: "Request Offer",
    startingConversation: "Opening conversation...",
    conversationStartError: "Could not start conversation",
    buyerOnlyMessaging: "Sign in to start a Jam Place conversation.",
    messagesEyebrow: "Jamly messages",
    messagesTitle: "Move the project into conversation.",
    messagesDescription:
      "Keep listing details, custom offers, and project decisions in one conversation with the artist.",
    conversations: "Conversations",
    searchConversations: "Search conversations",
    noConversations: "No conversations yet",
    noConversationsCopy: "Start your first conversation from a listing or artist profile.",
    selectConversation: "Select a conversation",
    selectConversationCopy: "Open a conversation on the left to see messages and project context here.",
    relatedListing: "Related listing",
    backToConversations: "Back to conversations",
    messagesLoading: "Loading conversations...",
    messagesSignInTitle: "Sign in to see your messages",
    messagesSignInCopy: "Live conversations are only visible to the participating buyer and artist.",
    demoMessages: "Demo conversations",
    unreadMessages: "unread messages",
    typeMessage: "Write a message...",
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
    accountDashboardEyebrow: "Account dashboard",
    accountDashboardTitle: "Discover and sell from one Jamly account.",
    accountDashboardDescription:
      "Jamly no longer splits accounts into rigid buyer or creator tags. Use the same account to request work, publish listings, and manage your profile storefront.",
    profileStorefront: "Profile storefront",
    sellerRequests: "Seller side",
    buyerWorkspace: "Buyer side",
    sellerModeTitle: "Seller workspace",
    sellerModeCopy:
      "Manage published beats, services, license prices, requests, and profile trust signals.",
    buyerModeTitle: "Buyer workspace",
    buyerModeCopy:
      "Track your shortlist, briefs, open requests, and project conversations in one place.",
    openSellerWorkspace: "Open seller workspace",
    openBuyerWorkspace: "Open buyer workspace",
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
    nextBuildTargetItems: "Service delivery workspace,Custom offers,Payments and payout provider,Creator analytics",
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
      "For beats, prepare all three fixed license prices and private delivery packages. For services, define one clear scope and price.",
    signInEyebrow: "Welcome back",
    signInTitle: "Sign in to Jamly",
    signInDescription: "Access dashboards, upload listings, and send demo order requests.",
    signUpEyebrow: "Create account",
    signUpTitle: "Create your Jamly account",
    signUpDescription:
      "Use one account to find music creators, request work, or publish your own listings.",
    fullName: "Full name",
    handle: "Handle",
    role: "Role",
    email: "Email",
    password: "Password",
    createAccount: "Create account",
    alreadyAccount: "Already have an account?",
    newToJamly: "New to Jamly?",
    liveAuthMissing: "Live sign-up and sign-in require a Supabase connection. You can explore the site without signing in while demo mode is active.",
    authDemoMode:
      "Demo preview mode is active. You can explore Jamly without signing in; live accounts become active once Supabase is connected.",
    supabaseMissing:
      "Demo preview mode is active. Live accounts, listings, and messages become active once Supabase is connected.",
    supabaseInvalidConfig:
      "The live Supabase connection is not complete yet. Jamly keeps using demo data until the Project URL, publishable key, and database schema are ready.",
    signedIn: "Signed in. You can now upload listings or request orders.",
    accountCreated: "Account created. Check your inbox if email confirmation is enabled.",
    authError: "Could not complete action",
    profileMissing: "No account profile was found. Please sign in again.",
    checkingAccount: "Checking your account...",
    uploadSignInTitle: "Sign in to publish a listing",
    uploadSignInCopy: "Jamly requires a session so every listing is connected to the correct account.",
    creatorOnlyTitle: "Sign in to publish a listing",
    creatorOnlyCopy: "One Jamly account can both buy from creators and publish a storefront.",
    creatorSessionRequired: "A verified session is required to save this listing.",
    dashboardLoading: "Preparing your workspace...",
    dashboardErrorTitle: "Could not load your workspace",
    dashboardRetry: "Try again",
    dashboardSignInTitle: "Sign in to view your dashboard",
    dashboardSignInCopy: "Your listings and order requests are shown only for your account.",
    wrongDashboardTitle: "This dashboard belongs to the other account role",
    wrongDashboardCreator: "Open the creator dashboard for your creator account.",
    wrongDashboardBuyer: "Open the buyer dashboard for your buyer account.",
    openCorrectDashboard: "Open correct dashboard",
    noCreatorListings: "You have not published a listing yet.",
    noCreatorListingsCopy: "Publish your first beat or music service to build your storefront.",
    noOrderRequests: "No order requests yet.",
    noOrderRequestsCopy: "New requests will appear here and open into an order conversation.",
    liveData: "Live account data",
    demoData: "Demo preview data",
    orderDetailEyebrow: "Order workspace",
    orderDetailTitle: "Project brief and conversation",
    orderBrief: "Project brief",
    orderStatus: "Order status",
    orderConversation: "Messages",
    orderConversationCopy: "Keep project decisions and next steps recorded inside the order.",
    noMessages: "No messages yet. Start the conversation with the first project detail.",
    messagePlaceholder: "Write about the project, references, or delivery expectations...",
    sendMessage: "Send message",
    messageError: "Could not send message",
    orderNotAvailable: "This order was not found or you do not have permission to view it.",
    orderSignInCopy: "Order details are visible only to the buyer and creator.",
    backToDashboard: "Back to dashboard",
    projectValue: "Project budget",
    participantBuyer: "Buyer",
    participantCreator: "Creator",
    noBriefProvided: "No additional project brief was included with this request.",
    creatorNotFound: "This creator profile could not be found.",
    formDemoMode:
      "Demo preview mode is active. You can try the form and file pickers; live Supabase will save listings to your account once connected.",
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
    invalidLicensePrices: "All three license prices must be greater than zero.",
    missingLicenseFiles: "Select the MP3, Unlimited ZIP, and Exclusive ZIP delivery packages.",
    invalidServicePrice: "The service price must be greater than zero.",
    unknownError: "Unknown error",
    licenseType: "License type",
    beatLicensePricing: "Fixed license structure",
    setThreeLicensePrices: "Set a selling price for every license",
    pricesStoredInUsd: "Enter prices in the selected currency; Jamly converts them to a USD base in the background.",
    priceCurrencyHint: "Current price input",
    convertedPriceHint: "Approximate USD value",
    listingBasicsStep: "1. Listing basics",
    listingBasicsCopy: "Add the title, category, and genre buyers need to understand the offer quickly.",
    listingMediaStep: "2. Preview media",
    listingMediaCopy: "A short audio preview and clear cover image directly improve buyer trust.",
    listingDeliveryStep: "3. Price and delivery",
    listingDeliveryCopy: "Enter prices in the selected currency; buyers see them in their own currency.",
    licenseDeliveryPackages: "Private delivery packages",
    uploadBuyerFiles: "Upload the files buyers receive after purchase",
    privateDeliveryFilesHint:
      "These files are private. Only the creator and the buyer who purchased the matching license can access a short-lived secure link.",
    deliveryMp3Hint: "A clean, deliverable .mp3 file for the MP3 license.",
    deliveryUnlimitedHint: "One .zip package containing WAV, MP3, and trackouts.",
    deliveryExclusiveHint: "One .zip package containing every file and the project file when available.",
    deliveryReady: "Delivery ready",
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
    checkoutEyebrow: "Beat license",
    checkoutTitle: "Choose the right license for your release.",
    checkoutDescription:
      "Compare file delivery and usage rights. License language is fixed; the creator sets only the price.",
    chooseLicense: "Choose license",
    selectedLicense: "Selected license",
    includedFiles: "Files delivered",
    licenseTerms: "Usage terms",
    orderTotal: "Total",
    purchaseLicense: "Complete license order",
    completingPurchase: "Recording license...",
    demoCheckoutNotice:
      "You are in demo mode. You can compare licenses, but the purchase is not written to a database.",
    livePurchaseRequiresAuth: "Sign in with your Jamly account to purchase this license.",
    checkoutBuyerOnly: "Sign in to complete a license purchase.",
    ownListingPurchaseBlocked: "You cannot purchase a license from your own listing.",
    checkoutUnavailable: "License sales are currently unavailable for this beat.",
    exclusiveSoldTitle: "Exclusive Sold",
    exclusiveSoldCopy:
      "This beat was sold exclusively. The listing is closed and no new license can be purchased.",
    exclusiveRemovesListing: "Purchasing this tier removes the listing from Jam Place.",
    mockPurchaseComplete: "Demo license selection complete",
    mockPurchaseCopy: "With live Supabase, this action records the order and unlocks its delivery package.",
    backToListing: "Back to listing",
    purchaseFailed: "License order could not be completed",
    licensePurchaseRecorded: "License order recorded. Your delivery package is ready on the order page.",
    viewOrder: "Open order and delivery",
    licensePurchased: "Purchased license",
    licenseVersion: "License template",
    deliveryPackage: "Secure delivery package",
    downloadPackage: "Download delivery package",
    preparingDownload: "Preparing secure link...",
    deliveryUnavailable: "The delivery package is not ready for this order.",
    downloadError: "Delivery package could not be downloaded",
    exclusiveSold: "Exclusive Sold",
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
  },
  "creator-dex": {
    tr: {
      headline: "R&B, pop ve indie kayıtlar için temiz gitar partileri",
      responseTime: "4 saat",
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
      ]
    },
    en: {
      headline: "Clean guitar parts for R&B, pop, and indie records",
      responseTime: "4 hours",
      specialties: ["Guitar", "R&B", "Live loops"],
      about:
        "Dex records DI and amp-toned guitar stems for singles, demos, and ad projects: clean rhythm layers, melodic replies, and hook-supporting loops.",
      bestFor: ["Guitar stems", "Pop/R&B singles", "Live texture"],
      notBestFor: ["Metal solos", "Full-band production"],
      workflow: ["Studies the reference tone", "Splits rhythm and lead direction", "Delivers a clean stem package"],
      requirements: ["Demo or chord progression", "BPM", "Reference guitar tone"],
      faq: [
        {
          question: "Do you deliver DI stems?",
          answer: "Yes, DI stems and processed guitar channels are delivered together."
        },
        {
          question: "Loop or full arrangement?",
          answer: "The package can be scoped as a short loop or full-song arrangement based on the brief."
        }
      ]
    }
  },
  "creator-rhea": {
    tr: {
      headline: "Söz, jingle ve kısa marka hook'larında hızlı konsept yazarı",
      responseTime: "2 saat",
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
      ]
    },
    en: {
      headline: "Fast concept writer for lyrics, jingles, and short brand hooks",
      responseTime: "2 hours",
      specialties: ["Lyrics", "Jingle", "Topline"],
      about:
        "Rhea turns song ideas into clear, memorable hooks and creates short, usable lyric options for brand jingles and social campaigns.",
      bestFor: ["Lyric sprint", "Jingle hooks", "Campaign melodies"],
      notBestFor: ["Full production", "Anonymous ghost vocals"],
      workflow: ["Extracts the message", "Writes 3 hook directions", "Develops the selected direction into a lyric file"],
      requirements: ["Theme or brand message", "Target audience", "Tempo reference"],
      faq: [
        {
          question: "How many alternatives are included?",
          answer: "The standard package includes three hook directions and one revision on the selected direction."
        },
        {
          question: "Can you write in Turkish?",
          answer: "Yes, English and Turkish briefs are supported."
        }
      ]
    }
  },
  "creator-atlas": {
    tr: {
      headline: "Single ve EP çıkışları için premium kapak görseli sistemi",
      responseTime: "5 saat",
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
      ]
    },
    en: {
      headline: "Premium cover-art systems for single and EP releases",
      responseTime: "5 hours",
      specialties: ["Cover art", "Release branding", "Motion teaser"],
      about:
        "Atlas translates a song world into visual language with streaming covers, social crops, and release announcement templates planned together.",
      bestFor: ["Single covers", "EP visual identity", "Social teasers"],
      notBestFor: ["Logo design", "Same-day illustration"],
      workflow: ["Builds a song moodboard", "Presents two creative directions", "Delivers final files in platform sizes"],
      requirements: ["Song title", "Visual reference", "Artist photo or direction"],
      faq: [
        {
          question: "Are streaming sizes included?",
          answer: "Yes, a 3000x3000 cover and social media crops are delivered."
        },
        {
          question: "Can a motion teaser be added?",
          answer: "A short motion teaser can be added as an extra service."
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
  },
  "neon-session-guitar": {
    tr: {
      title: "Neon Session Guitar",
      genre: "Pop/R&B",
      description:
        "Single'ınız için temiz DI ve işlenmiş gitar stemleri: parlak ritim katmanı, kısa lead cevapları ve hook'u dolduran canlı loop seçenekleri.",
      turnaround: "3 gün",
      tags: ["Gitar", "R&B", "DI stem", "Canlı loop"],
      deliverables: ["DI gitar", "İşlenmiş gitar stemleri", "Kısa aranjman notu"],
      filesIncluded: ["DI WAV", "Amp WAV", "Loop referansları"],
      revisionPolicy: "Bir ton ve performans notu turu dahildir.",
      markers: [
        { label: "Ritim", time: 12 },
        { label: "Lead cevap", time: 48 },
        { label: "Hook loop", time: 83 }
      ]
    },
    en: {
      title: "Neon Session Guitar",
      genre: "Pop/R&B",
      description:
        "Clean DI and processed guitar stems for your single: bright rhythm layers, short lead replies, and live loop options that support the hook.",
      turnaround: "3 days",
      tags: ["Guitar", "R&B", "DI stem", "Live loop"],
      deliverables: ["DI guitar", "Processed guitar stems", "Short arrangement note"],
      filesIncluded: ["DI WAV", "Amp WAV", "Loop refs"],
      revisionPolicy: "One tone and performance note round is included.",
      markers: [
        { label: "Rhythm", time: 12 },
        { label: "Lead reply", time: 48 },
        { label: "Hook loop", time: 83 }
      ]
    }
  },
  "lyrics-hook-sprint": {
    tr: {
      title: "Lyrics & Hook Sprint",
      genre: "Pop",
      description:
        "Şarkı fikriniz için üç güçlü hook yönü, söz dosyası ve seçilen yöne göre kısa topline notları. Özellikle hızlı single yazım seansları için.",
      turnaround: "48 saat",
      tags: ["Söz", "Hook", "Topline", "Türkçe/İngilizce"],
      deliverables: ["3 hook yönü", "Söz dosyası", "Topline notu"],
      filesIncluded: ["Söz PDF", "Melodi notu", "Referans notları"],
      revisionPolicy: "Seçilen hook yönünde bir revizyon turu dahildir.",
      markers: [
        { label: "Hook A", time: 18 },
        { label: "Hook B", time: 46 },
        { label: "Final not", time: 74 }
      ]
    },
    en: {
      title: "Lyrics & Hook Sprint",
      genre: "Pop",
      description:
        "Three strong hook directions, a lyric file, and short topline notes for your song idea. Built for fast single-writing sessions.",
      turnaround: "48 hours",
      tags: ["Lyrics", "Hook", "Topline", "Turkish/English"],
      deliverables: ["3 hook directions", "Lyric file", "Topline note"],
      filesIncluded: ["Lyrics PDF", "Melody memo", "Reference notes"],
      revisionPolicy: "One revision round is included on the selected hook direction.",
      markers: [
        { label: "Hook A", time: 18 },
        { label: "Hook B", time: 46 },
        { label: "Final note", time: 74 }
      ]
    }
  },
  "brand-jingle-hook": {
    tr: {
      title: "Brand Jingle Hook",
      genre: "Brand Jingle",
      description:
        "Reklam, podcast intro veya sosyal kampanya için akılda kalan kısa jingle melodisi, söz yönü ve iki alternatif slogan fikri.",
      turnaround: "1 hafta",
      tags: ["Jingle", "Marka", "Slogan", "Kısa hook"],
      deliverables: ["Jingle melodisi", "Söz/slogan önerileri", "Kullanım notu"],
      filesIncluded: ["Demo WAV", "Söz PDF", "Marka notları"],
      revisionPolicy: "Bir konsept revizyonu dahildir; yeni kampanya mesajı yeni kapsam sayılır.",
      markers: [
        { label: "Logo hook", time: 8 },
        { label: "Tagline", time: 27 },
        { label: "Alt slogan", time: 51 }
      ]
    },
    en: {
      title: "Brand Jingle Hook",
      genre: "Brand Jingle",
      description:
        "A memorable short jingle melody, lyric direction, and two alternate tagline ideas for ads, podcast intros, or social campaigns.",
      turnaround: "1 week",
      tags: ["Jingle", "Brand", "Slogan", "Short hook"],
      deliverables: ["Jingle melody", "Lyric/tagline ideas", "Usage note"],
      filesIncluded: ["Demo WAV", "Lyrics PDF", "Brand notes"],
      revisionPolicy: "One concept revision is included; a new campaign message is a new scope.",
      markers: [
        { label: "Logo hook", time: 8 },
        { label: "Tagline", time: 27 },
        { label: "Alt slogan", time: 51 }
      ]
    }
  },
  "launch-cover-system": {
    tr: {
      title: "Launch Cover System",
      genre: "Kapak Görseli",
      description:
        "Single veya EP için premium kapak görseli, sosyal medya kırpımları ve release duyuru görselleri. Şarkı mood'una göre iki kreatif yön hazırlanır.",
      turnaround: "5 gün",
      tags: ["Kapak görseli", "Release", "Sosyal medya", "Moodboard"],
      deliverables: ["3000x3000 kapak", "Sosyal kırpımlar", "Release duyuru görseli"],
      filesIncluded: ["PNG kapak", "JPG varyantlar", "Sosyal kırpımlar"],
      revisionPolicy: "Seçilen kreatif yönde iki görsel revizyon turu dahildir.",
      markers: [
        { label: "Mood", time: 0 },
        { label: "Yön A", time: 32 },
        { label: "Launch kit", time: 68 }
      ]
    },
    en: {
      title: "Launch Cover System",
      genre: "Cover Art",
      description:
        "Premium cover art, social crops, and release announcement visuals for a single or EP. Two creative directions are prepared around the song mood.",
      turnaround: "5 days",
      tags: ["Cover art", "Release", "Social media", "Moodboard"],
      deliverables: ["3000x3000 cover", "Social crops", "Release announcement visual"],
      filesIncluded: ["PNG cover", "JPG variants", "Social crops"],
      revisionPolicy: "Two visual revision rounds are included on the selected creative direction.",
      markers: [
        { label: "Mood", time: 0 },
        { label: "Direction A", time: 32 },
        { label: "Launch kit", time: 68 }
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
    ? [
        "Trap Soul",
        "Pop",
        "Hip-Hop",
        "Afrobeats",
        "Indie Pop",
        "Pop/R&B",
        "Brand Jingle",
        "Cover Art",
        "Tüm türler"
      ]
    : [
        "Trap Soul",
        "Pop",
        "Hip-Hop",
        "Afrobeats",
        "Indie Pop",
        "Pop/R&B",
        "Brand Jingle",
        "Cover Art",
        "Any Genre"
      ];
}
