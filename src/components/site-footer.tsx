"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { JamlyWordmark } from "@/components/jamly-logo";
import { LanguageToggle } from "@/components/language-toggle";
import { useI18n } from "@/components/language-provider";
import { createMailto, JAMLY_EMAILS } from "@/lib/jamly-contacts";

export function SiteFooter() {
  const { language } = useI18n();
  const groups = [
    {
      title: language === "tr" ? "Platform" : "Platform",
      links: [
        { href: "/discover", label: language === "tr" ? "Jam Alanı" : "Jam Place" },
        { href: "/beats", label: language === "tr" ? "Beatler" : "Beats" },
        {
          href: "/services",
          label: language === "tr" ? "Hizmetler" : "Services"
        },
        { href: "/#creators", label: language === "tr" ? "Üreticiler" : "Producers" },
        { href: "/jam-match", label: "Jam Match" }
      ]
    },
    {
      title: language === "tr" ? "Üreticiler" : "Creators",
      links: [
        { href: "/upload", label: language === "tr" ? "İş yayınla" : "Publish work" },
        {
          href: "/dashboard/creator",
          label: language === "tr" ? "Satış alanı" : "Seller workspace"
        },
        {
          href: "/dashboard",
          label: language === "tr" ? "Hesap paneli" : "Account dashboard"
        }
      ]
    },
    {
      title: language === "tr" ? "Bağlantı" : "Connect",
      links: [
        { href: "/messages", label: language === "tr" ? "Mesajlar" : "Messages" },
        {
          href: "/auth/sign-in",
          label: language === "tr" ? "Giriş yap" : "Sign in"
        },
        {
          href: "/auth/sign-up",
          label: language === "tr" ? "Hesap oluştur" : "Create account"
        }
      ]
    },
    {
      title: language === "tr" ? "Destek" : "Support",
      links: [
        {
          href: createMailto(JAMLY_EMAILS.support, {
            subject: language === "tr" ? "Jamly destek talebi" : "Jamly support request"
          }),
          label: language === "tr" ? "Destek ekibi" : "Support team"
        },
        {
          href: createMailto(JAMLY_EMAILS.payment, {
            subject: language === "tr" ? "Jamly ödeme desteği" : "Jamly payment support"
          }),
          label: language === "tr" ? "Ödeme desteği" : "Payment support"
        },
        {
          href: createMailto(JAMLY_EMAILS.contact, {
            subject: language === "tr" ? "Jamly iletişim" : "Contact Jamly"
          }),
          label: language === "tr" ? "Bize ulaşın" : "Contact us"
        },
        {
          href: createMailto(JAMLY_EMAILS.social, {
            subject: language === "tr" ? "Jamly iş birliği" : "Jamly partnership"
          }),
          label: language === "tr" ? "İş birlikleri" : "Partnerships"
        }
      ]
    }
  ];

  return (
    <footer className="border-t border-white/[0.08] bg-[#080a0f]">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-14 sm:px-6 lg:px-8 xl:px-10">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1.9fr]">
          <div className="max-w-sm">
            <JamlyWordmark />
            <p className="mt-5 text-sm leading-6 text-white/48">
              {language === "tr"
                ? "Beat lisansları, vokal, söz yazımı, miks, mastering ve özel prodüksiyon için bağımsız müzik üreticilerinin Jam Alanı."
                : "The Jam Place for beat licenses, vocals, songwriting, mixing, mastering, and custom production."}
            </p>
            <Link
              href="/discover"
              className="focus-ring mt-6 inline-flex min-h-11 items-center gap-2 rounded-md border border-white/10 px-4 text-sm font-semibold text-white/72 transition hover:border-jam-blue/40 hover:bg-jam-blue/10 hover:text-white"
            >
              {language === "tr" ? "Jam Alanı'nı aç" : "Open Jam Place"}
              <ArrowUpRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {groups.map((group) => (
              <div key={group.title}>
                <h2 className="text-xs font-semibold uppercase text-white/36">
                  {group.title}
                </h2>
                <div className="mt-4 grid gap-3">
                  {group.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="focus-ring w-fit rounded-sm text-sm text-white/58 transition hover:text-white"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-5 border-t border-white/[0.08] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/34">
            © {new Date().getFullYear()} JAMLY.{" "}
            {language === "tr" ? "Tüm hakları saklıdır." : "All rights reserved."}
          </p>
          <LanguageToggle menuPlacement="top" />
        </div>
      </div>
    </footer>
  );
}
