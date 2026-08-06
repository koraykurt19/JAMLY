"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  AudioLines,
  BriefcaseBusiness,
  Clock3,
  FileAudio,
  Guitar,
  Headphones,
  MessageCircle,
  Mic2,
  PenLine,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Upload,
  UserRound,
  WandSparkles,
  Waves
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { CategoryCard } from "@/components/category-card";
import { CreatorCard } from "@/components/creator-card";
import { ListingCard } from "@/components/listing-card";
import { SectionHeading } from "@/components/section-heading";
import { useI18n } from "@/components/language-provider";
import { creators as demoCreators, listings as demoListings } from "@/lib/data";
import { localizeCreator, localizeListing } from "@/lib/i18n";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured
} from "@/lib/supabase";
import {
  fetchCreators,
  fetchMarketplaceListings
} from "@/lib/supabase-data";
import type { Creator, Listing } from "@/lib/types";

const heroImage =
  "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1800&q=84";

type HomeDataState =
  | { status: "loading" }
  | { status: "ready"; listings: Listing[]; creators: Creator[]; isDemo: boolean }
  | { status: "error"; message: string };

export default function LandingPage() {
  const { language } = useI18n();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [showcaseSeed, setShowcaseSeed] = useState(0.42);
  const [dataState, setDataState] = useState<HomeDataState>(() =>
    isSupabaseConfigured()
      ? { status: "loading" }
      : {
          status: "ready",
          listings: demoListings,
          creators: demoCreators,
          isDemo: true
        }
  );

  useEffect(() => {
    setShowcaseSeed(Math.random());
  }, []);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) {
      setDataState({
        status: "ready",
        listings: demoListings,
        creators: demoCreators,
        isDemo: true
      });
      return;
    }

    let active = true;
    setDataState({ status: "loading" });

    Promise.all([fetchMarketplaceListings(client), fetchCreators(client)])
      .then(([liveListings, liveCreators]) => {
        if (!active) return;
        setDataState({
          status: "ready",
          listings: liveListings.filter(
            (listing) => listing.isActive && !listing.exclusiveSold
          ),
          creators: liveCreators,
          isDemo: false
        });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setDataState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : language === "tr"
                ? "Jam Alanı verileri yüklenemedi."
                : "Jam Place data could not be loaded."
        });
      });

    return () => {
      active = false;
    };
  }, [language, reloadKey]);

  const localizedListings = useMemo(
    () =>
      dataState.status === "ready"
        ? dataState.listings.map((listing) => localizeListing(listing, language))
        : [],
    [dataState, language]
  );
  const localizedCreators = useMemo(
    () =>
      dataState.status === "ready"
        ? dataState.creators.map((creator) => localizeCreator(creator, language))
        : [],
    [dataState, language]
  );
  const creatorById = useMemo(
    () => new Map(localizedCreators.map((creator) => [creator.id, creator])),
    [localizedCreators]
  );
  const featuredListings = useMemo(
    () => rankListings(localizedListings).slice(0, 6),
    [localizedListings]
  );
  const serviceListings = useMemo(
    () =>
      rankListings(
        localizedListings.filter(
          (listing) =>
            listing.category !== "Beat" && listing.licenseType === "Service"
        )
      ).slice(0, 4),
    [localizedListings]
  );
  const featuredCreators = useMemo(
    () =>
      [...localizedCreators]
        .sort(
          (a, b) =>
            Number(b.verified) - Number(a.verified) ||
            b.profileStrength - a.profileStrength
        )
        .slice(0, 4),
    [localizedCreators]
  );
  const showcaseListing = useMemo(
    () => chooseShowcaseListing(featuredListings, showcaseSeed),
    [featuredListings, showcaseSeed]
  );

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = search.trim();
    router.push(query ? `/marketplace?q=${encodeURIComponent(query)}` : "/marketplace");
  }

  const categories = [
    {
      href: "/marketplace?q=Beat",
      title: language === "tr" ? "Beatler" : "Beats",
      description:
        language === "tr"
          ? "Lisans seçenekleri, BPM ve ses önizlemesiyle karşılaştır."
          : "Compare licenses, BPM, and audio previews.",
      icon: Waves
    },
    {
      href: "/marketplace?q=Vocal",
      title: language === "tr" ? "Vokal" : "Vocals",
      description:
        language === "tr"
          ? "Lead, hook, armoni ve kayıt katkıları bul."
          : "Find lead, hook, harmony, and recording work.",
      icon: Mic2
    },
    {
      href: "/marketplace?q=Mixing",
      title: language === "tr" ? "Mix & Master" : "Mix & Master",
      description:
        language === "tr"
          ? "Yayına hazır miks ve mastering hizmetlerini incele."
          : "Explore release-ready mixing and mastering.",
      icon: SlidersHorizontal
    },
    {
      href: "/marketplace?q=Songwriting",
      title: language === "tr" ? "Söz Yazımı" : "Songwriting",
      description:
        language === "tr"
          ? "Hook, topline ve şarkı sözü desteği al."
          : "Get hooks, toplines, and lyric support.",
      icon: PenLine
    },
    {
      href: "/marketplace?q=Custom Production",
      title: language === "tr" ? "Özel Prodüksiyon" : "Custom Production",
      description:
        language === "tr"
          ? "Brief'inize göre sıfırdan bir prodüksiyon başlatın."
          : "Start a production built around your brief.",
      icon: WandSparkles
    },
    {
      href: "/marketplace?q=Guitar",
      title: language === "tr" ? "Enstrüman" : "Session Instruments",
      description:
        language === "tr"
          ? "Gitar ve canlı kayıt katkılarını keşfet."
          : "Discover guitar and live recording contributions.",
      icon: Guitar
    }
  ];

  return (
    <div className="overflow-x-clip">
      <section className="relative isolate border-b border-white/[0.08]">
        <Image
          src={heroImage}
          alt={
            language === "tr"
              ? "Profesyonel müzik prodüksiyon stüdyosu"
              : "Professional music production studio"
          }
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[#080a0f]/76" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#080a0f_3%,rgba(8,10,15,0.82)_48%,rgba(8,10,15,0.48)),linear-gradient(180deg,transparent_55%,#080a0f_100%)]" />

        <div className="relative mx-auto grid min-h-[620px] w-full max-w-[1440px] items-center gap-12 px-4 py-12 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.72fr)] lg:px-8 lg:py-10 xl:px-10">
          <div className="min-w-0 max-w-3xl">
            <p className="inline-flex max-w-full items-center gap-2 rounded-md border border-jam-mint/24 bg-jam-mint/10 px-3 py-2 text-xs font-semibold uppercase leading-5 text-jam-mint">
              <span className="h-1.5 w-1.5 rounded-full bg-jam-mint" />
              {language === "tr"
                ? "Beat lisansları ve profesyonel müzik hizmetleri"
                : "Beat licenses and professional music services"}
            </p>
            <h1 className="mt-6 max-w-[19rem] text-[2.35rem] font-semibold leading-[1.04] text-white sm:max-w-none sm:text-[3.5rem] lg:text-[4.25rem] xl:text-[4.6rem]">
              {language === "tr"
                ? "Aradığın sesi bul. Projeni doğru kişiyle tamamla."
                : "Find your sound. Finish with the right collaborator."}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/66 sm:text-lg">
              {language === "tr"
                ? "Beatleri dinleyip lisansları karşılaştırın; vokal, söz yazımı, miks, mastering ve özel prodüksiyon için bağımsız üreticilerle doğrudan çalışın."
                : "Preview beats and compare licenses, or work directly with independent creators for vocals, songwriting, mixing, mastering, and custom production."}
            </p>

            <form
              onSubmit={submitSearch}
              className="mt-8 flex w-full max-w-3xl flex-col gap-2 rounded-lg border border-white/14 bg-[#f7f9fc] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.32)] sm:flex-row"
            >
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">
                  {language === "tr" ? "Jam Alanı'nda ara" : "Search Jam Place"}
                </span>
                <Search
                  size={20}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-black/38"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={
                    language === "tr"
                      ? "Beat, vokal, mix/master veya üretici ara"
                      : "Search beats, vocals, mix/master, or creators"
                  }
                  className="h-[52px] w-full rounded-md bg-transparent pl-12 pr-3 text-base font-medium text-[#080a0f] outline-none placeholder:text-black/42"
                />
              </label>
              <button
                type="submit"
                className="focus-ring inline-flex min-h-[52px] w-full shrink-0 items-center justify-center gap-2 rounded-md bg-[#080a0f] px-6 text-sm font-bold text-white transition hover:bg-jam-blue sm:w-auto"
              >
                {language === "tr" ? "Keşfet" : "Discover"}
                <ArrowRight size={17} />
              </button>
            </form>

            <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
              {["Trap", "R&B", "Afrobeat", "Drill", "Female Vocal", "Mix & Master"].map(
                (query) => (
                  <Link
                    key={query}
                    href={`/marketplace?q=${encodeURIComponent(query)}`}
                    className="focus-ring inline-flex min-h-10 shrink-0 items-center rounded-md border border-white/10 bg-black/24 px-3 text-sm font-medium text-white/58 transition hover:border-jam-blue/40 hover:bg-jam-blue/10 hover:text-white"
                  >
                    {query}
                  </Link>
                )
              )}
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/marketplace"
                className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-jam-mint px-5 text-sm font-bold text-[#071018] transition hover:bg-white"
              >
                {language === "tr" ? "Jam Alanı'nı keşfet" : "Explore Jam Place"}
                <ArrowRight size={17} />
              </Link>
              <Link
                href="/jam-match"
                className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-white/12 bg-black/20 px-5 text-sm font-semibold text-white/78 transition hover:border-jam-blue/45 hover:bg-jam-blue/10 hover:text-white"
              >
                <Sparkles size={17} className="text-jam-mint" />
                Jam Match
              </Link>
            </div>
          </div>

          <div className="hidden lg:block">
            {showcaseListing ? (
              <div>
                <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase text-white/44">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-jam-success" />
                    {language === "tr" ? "Canlı vitrin" : "Live storefront"}
                  </span>
                  <span>{language === "tr" ? "Revaçtaki iş" : "Trending now"}</span>
                </div>
                <ListingCard
                  listing={showcaseListing}
                  priority
                  creatorVerified={Boolean(
                    creatorById.get(showcaseListing.creatorId)?.verified
                  )}
                  density="compact"
                />
              </div>
            ) : (
              <div className="aspect-[4/5] rounded-lg border border-dashed border-white/12 bg-white/[0.03]" />
            )}
          </div>
        </div>
      </section>

      <div>
        <section className="mx-auto w-full max-w-[1440px] px-4 py-20 sm:px-6 lg:px-8 lg:py-24 xl:px-10">
          <SectionTop
            eyebrow={language === "tr" ? "Şu an Jamly'de" : "Now on Jamly"}
            title={language === "tr" ? "Öne çıkan işler" : "Trending on Jamly"}
            description={
              language === "tr"
                ? "Beatlerden vokal ve post-prodüksiyon hizmetlerine uzanan güncel işler."
                : "Current work across beats, vocals, and post-production services."
            }
            href="/marketplace"
            linkLabel={language === "tr" ? "Tümünü gör" : "View all"}
          />
          <MarketplaceDataRegion
            state={dataState}
            listings={featuredListings}
            creatorById={creatorById}
            onRetry={() => setReloadKey((value) => value + 1)}
            language={language}
          />
        </section>

        <section className="border-y border-white/[0.08] bg-[#0d1118]">
          <div className="mx-auto w-full max-w-[1440px] px-4 py-20 sm:px-6 lg:px-8 lg:py-24 xl:px-10">
            <SectionHeading
              eyebrow={language === "tr" ? "Yolunu seç" : "Choose your lane"}
              title={
                language === "tr"
                  ? "İhtiyacına göre keşfet"
                  : "Explore by what your project needs"
              }
              description={
                language === "tr"
                  ? "Doğru kategoriye girin, sesleri dinleyin ve kapsamı karşılaştırın."
                  : "Enter the right category, preview the work, and compare scope."
              }
            />
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category, index) => (
                <CategoryCard
                  key={category.href}
                  {...category}
                  accent={index % 2 === 0 ? "cyan" : "blue"}
                />
              ))}
            </div>
          </div>
        </section>

        <section
          id="creators"
          className="scroll-mt-24 mx-auto w-full max-w-[1440px] px-4 py-20 sm:px-6 lg:px-8 lg:py-24 xl:px-10"
        >
          <SectionTop
            eyebrow={language === "tr" ? "Yetenek vitrini" : "Creator roster"}
            title={language === "tr" ? "Öne çıkan üreticiler" : "Featured creators"}
            description={
              language === "tr"
                ? "Portföyü, uzmanlığı ve çalışma geçmişi görünür üreticileri keşfedin."
                : "Discover creators through their portfolio, specialty, and visible work history."
            }
            href="/marketplace"
            linkLabel={language === "tr" ? "Üretici ara" : "Find a creator"}
          />
          {dataState.status === "loading" ? (
            <CreatorSkeletons />
          ) : dataState.status === "ready" && featuredCreators.length > 0 ? (
            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {featuredCreators.map((creator) => (
                <CreatorCard
                  key={creator.id}
                  creator={creator}
                  previewListing={localizedListings.find(
                    (listing) =>
                      listing.creatorId === creator.id &&
                      Boolean(listing.audioPreviewUrl.trim())
                  )}
                />
              ))}
            </div>
          ) : dataState.status === "ready" ? (
            <EmptySection
              title={
                language === "tr"
                  ? "Henüz üretici profili bulunmuyor."
                  : "No creator profiles yet."
              }
            />
          ) : null}
        </section>

        <section className="border-y border-white/[0.08] bg-[#0d1118]">
          <div className="mx-auto w-full max-w-[1440px] px-4 py-20 sm:px-6 lg:px-8 lg:py-24 xl:px-10">
            <SectionTop
              eyebrow={
                language === "tr" ? "Profesyonel hizmetler" : "Professional services"
              }
              title={
                language === "tr"
                  ? "Kaydını yayına hazır hale getir"
                  : "Take your record to release-ready"
              }
              description={
                language === "tr"
                  ? "Teslim kapsamı ve süreleri açık miks, mastering, vokal ve yazım hizmetleri."
                  : "Mixing, mastering, vocal, and writing services with visible scope and delivery terms."
              }
              href="/marketplace?q=Mixing"
              linkLabel={language === "tr" ? "Hizmetleri aç" : "Browse services"}
            />
            {dataState.status === "loading" ? (
              <ListingSkeletons count={4} />
            ) : serviceListings.length > 0 ? (
              <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {serviceListings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    creatorVerified={Boolean(
                      creatorById.get(listing.creatorId)?.verified
                    )}
                    density="compact"
                  />
                ))}
              </div>
            ) : dataState.status === "ready" ? (
              <EmptySection
                title={
                  language === "tr"
                    ? "Bu alanda henüz aktif hizmet yok."
                    : "No active services in this area yet."
                }
              />
            ) : null}
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1440px] px-4 py-20 sm:px-6 lg:px-8 lg:py-24 xl:px-10">
          <SectionHeading
            eyebrow={language === "tr" ? "Çalışma akışı" : "How it works"}
            title={
              language === "tr"
                ? "Keşiften iş birliğine, net bir akış"
                : "A clear path from discovery to collaboration"
            }
          />
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            <WorkflowColumn
              icon={Headphones}
              label={language === "tr" ? "Alıcılar için" : "For buyers"}
              steps={
                language === "tr"
                  ? [
                      ["Keşfet veya ara", "Kategori, tür ve proje ihtiyacınıza göre daraltın."],
                      ["Dinle ve karşılaştır", "Ses önizlemelerini, lisansları ve teslim kapsamını inceleyin."],
                      ["Talep gönder", "Üreticiye ulaşın veya mevcut sipariş talebi akışını başlatın."]
                    ]
                  : [
                      ["Discover or search", "Narrow by category, genre, and project need."],
                      ["Preview and compare", "Review audio, licenses, and delivery scope."],
                      ["Send a request", "Contact the creator or start the current request flow."]
                    ]
              }
            />
            <WorkflowColumn
              icon={BriefcaseBusiness}
              label={language === "tr" ? "Üreticiler için" : "For creators"}
              steps={
                language === "tr"
                  ? [
                      ["Profilini tamamla", "Uzmanlığını, portföyünü ve çalışma biçimini görünür kıl."],
                      ["İşini yayınla", "Beat lisanslarını veya hizmet kapsamını açıkça tanımla."],
                      ["Talepleri yönet", "Mesajları ve proje taleplerini mevcut panelden takip et."]
                    ]
                  : [
                      ["Complete your profile", "Make your specialty, portfolio, and process visible."],
                      ["Publish your work", "Define beat licenses or service scope clearly."],
                      ["Manage requests", "Track messages and project requests in the current dashboard."]
                    ]
              }
            />
          </div>
        </section>

        <section className="border-y border-white/[0.08] bg-[#0d1118]">
          <div className="mx-auto grid w-full max-w-[1440px] gap-px bg-white/[0.08] sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: FileAudio,
                title: language === "tr" ? "Ses önizlemeleri" : "Audio previews",
                copy:
                  language === "tr"
                    ? "İşi detay sayfasına geçmeden dinleyin."
                    : "Listen before opening the full detail."
              },
              {
                icon: ShieldCheck,
                title: language === "tr" ? "Açık lisans bilgisi" : "Clear license details",
                copy:
                  language === "tr"
                    ? "Beat seçeneklerini ve teslim dosyalarını karşılaştırın."
                    : "Compare beat options and delivery files."
              },
              {
                icon: Clock3,
                title: language === "tr" ? "Görünür teslim şartları" : "Visible delivery terms",
                copy:
                  language === "tr"
                    ? "Hizmet kapsamını ve süreyi baştan görün."
                    : "See service scope and timing up front."
              },
              {
                icon: MessageCircle,
                title: language === "tr" ? "Doğrudan iletişim" : "Direct contact",
                copy:
                  language === "tr"
                    ? "Üreticiyle Jamly mesajları üzerinden konuşun."
                    : "Talk with creators through Jamly messages."
              }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="bg-[#0d1118] p-6 lg:p-8">
                  <Icon size={21} className="text-jam-mint" />
                  <h3 className="mt-5 text-base font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-5 text-white/46">{item.copy}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1440px] px-4 py-20 sm:px-6 lg:px-8 lg:py-24 xl:px-10">
          <div className="grid overflow-hidden rounded-lg border border-white/[0.09] bg-[#121722] lg:grid-cols-2">
            <FinalCta
              eyebrow={language === "tr" ? "Bir proje için" : "For your project"}
              title={language === "tr" ? "Doğru sesi bul" : "Find the right sound"}
              copy={
                language === "tr"
                  ? "Beatleri ve profesyonel müzik hizmetlerini tek yerde karşılaştırın."
                  : "Compare beats and professional music services in one place."
              }
              href="/marketplace"
              label={
                language === "tr" ? "Jam Alanı'nı keşfet" : "Explore Jam Place"
              }
              icon={Search}
            />
            <FinalCta
              eyebrow={language === "tr" ? "Üreticiler için" : "For creators"}
              title={language === "tr" ? "İşlerini yayınla" : "Publish your work"}
              copy={
                language === "tr"
                  ? "Beatlerinizi, hizmetlerinizi ve portföyünüzü doğru alıcılarla buluşturun."
                  : "Put your beats, services, and portfolio in front of the right buyers."
              }
              href="/upload"
              label={language === "tr" ? "Üretici olarak başla" : "Start as a creator"}
              icon={Upload}
              bordered
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function MarketplaceDataRegion({
  state,
  listings,
  creatorById,
  onRetry,
  language
}: {
  state: HomeDataState;
  listings: Listing[];
  creatorById: Map<string, Creator>;
  onRetry: () => void;
  language: "tr" | "en";
}) {
  if (state.status === "loading") return <ListingSkeletons count={6} />;

  if (state.status === "error") {
    return (
      <div className="mt-10 flex min-h-56 flex-col items-center justify-center rounded-lg border border-red-400/20 bg-red-400/[0.06] p-8 text-center">
        <AudioLines size={24} className="text-red-300" />
        <h3 className="mt-4 font-semibold text-white">
          {language === "tr"
            ? "Jam Alanı şu anda yüklenemedi."
            : "Jam Place could not be loaded."}
        </h3>
        <p className="mt-2 max-w-xl text-sm text-white/48">{state.message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="focus-ring mt-5 inline-flex min-h-11 items-center gap-2 rounded-md border border-white/12 px-4 text-sm font-semibold text-white/72 transition hover:bg-white/[0.06] hover:text-white"
        >
          <RefreshCw size={16} />
          {language === "tr" ? "Yeniden dene" : "Try again"}
        </button>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <EmptySection
        title={
          language === "tr"
            ? "Henüz aktif ilan bulunmuyor."
            : "No active listings yet."
        }
      />
    );
  }

  return (
    <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {listings.map((listing, index) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          priority={index < 2}
          creatorVerified={Boolean(creatorById.get(listing.creatorId)?.verified)}
        />
      ))}
    </div>
  );
}

function SectionTop({
  eyebrow,
  title,
  description,
  href,
  linkLabel
}: {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <SectionHeading eyebrow={eyebrow} title={title} description={description} />
      <Link
        href={href}
        className="focus-ring inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded-md border border-white/10 px-4 text-sm font-semibold text-white/64 transition hover:border-jam-blue/40 hover:bg-jam-blue/10 hover:text-white sm:self-auto"
      >
        {linkLabel}
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}

function WorkflowColumn({
  icon: Icon,
  label,
  steps
}: {
  icon: typeof Headphones;
  label: string;
  steps: string[][];
}) {
  return (
    <div className="rounded-lg border border-white/[0.09] bg-[#121722] p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-md bg-jam-blue/12 text-jam-mint">
          <Icon size={21} />
        </span>
        <h3 className="text-lg font-semibold text-white">{label}</h3>
      </div>
      <ol className="mt-7 grid gap-6">
        {steps.map(([title, copy], index) => (
          <li key={title} className="grid grid-cols-[2rem_1fr] gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-jam-blue/28 bg-jam-blue/10 text-xs font-bold text-jam-mint">
              {index + 1}
            </span>
            <div>
              <h4 className="font-semibold text-white">{title}</h4>
              <p className="mt-1 text-sm leading-5 text-white/48">{copy}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function FinalCta({
  eyebrow,
  title,
  copy,
  href,
  label,
  icon: Icon,
  bordered = false
}: {
  eyebrow: string;
  title: string;
  copy: string;
  href: string;
  label: string;
  icon: typeof Search;
  bordered?: boolean;
}) {
  return (
    <div
      className={`p-7 sm:p-10 lg:p-12 ${
        bordered ? "border-t border-white/[0.09] lg:border-l lg:border-t-0" : ""
      }`}
    >
      <p className="text-xs font-semibold uppercase text-jam-mint">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold text-white">{title}</h2>
      <p className="mt-3 max-w-md text-sm leading-6 text-white/52">{copy}</p>
      <Link
        href={href}
        className="focus-ring mt-7 inline-flex min-h-12 items-center gap-2 rounded-md bg-white px-5 text-sm font-bold text-[#080a0f] transition hover:bg-jam-mint"
      >
        <Icon size={17} />
        {label}
      </Link>
    </div>
  );
}

function ListingSkeletons({ count }: { count: number }) {
  return (
    <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-lg border border-white/[0.08] bg-[#121722]"
        >
          <div className="aspect-[4/3] animate-pulse bg-white/[0.055]" />
          <div className="space-y-3 p-5">
            <div className="h-5 w-2/3 animate-pulse rounded bg-white/[0.08]" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-white/[0.055]" />
            <div className="h-11 animate-pulse rounded-md bg-white/[0.045]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function CreatorSkeletons() {
  return (
    <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-lg border border-white/[0.08] bg-[#121722]"
        >
          <div className="aspect-[16/9] animate-pulse bg-white/[0.055]" />
          <div className="space-y-3 p-5">
            <div className="h-5 w-1/2 animate-pulse rounded bg-white/[0.08]" />
            <div className="h-12 animate-pulse rounded bg-white/[0.05]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptySection({ title }: { title: string }) {
  return (
    <div className="mt-10 flex min-h-48 items-center justify-center rounded-lg border border-dashed border-white/12 bg-white/[0.02] p-8 text-center">
      <div>
        <UserRound size={22} className="mx-auto text-white/28" />
        <p className="mt-3 text-sm font-semibold text-white/58">{title}</p>
      </div>
    </div>
  );
}

function rankListings(listings: Listing[]) {
  return [...listings].sort((a, b) => getListingScore(b) - getListingScore(a));
}

function getListingScore(listing: Listing) {
  return (
    Number(listing.featured) * 1200 +
    listing.analytics.plays * 0.45 +
    listing.analytics.saves * 4 +
    listing.analytics.conversionRate * 36 +
    new Date(listing.createdAt).getTime() / 1e12
  );
}

function chooseShowcaseListing(listings: Listing[], seed: number) {
  if (listings.length === 0) return null;
  const candidates = listings.slice(0, 6);
  const weights = candidates.map((listing) => Math.max(1, getListingScore(listing)));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let cursor = seed * total;

  for (let index = 0; index < candidates.length; index += 1) {
    cursor -= weights[index] ?? 0;
    if (cursor <= 0) return candidates[index] ?? candidates[0] ?? null;
  }

  return candidates[candidates.length - 1] ?? null;
}
