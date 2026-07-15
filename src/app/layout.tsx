import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LanguageProvider } from "@/components/language-provider";

export const metadata: Metadata = {
  title: "Jamly - Müzik üreticileri Jam Alanı",
  description:
    "Beat, hook, miks ve özel prodüksiyon işleri için premium müzik üreticileri Jam Alanı.",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-v8.svg", type: "image/svg+xml" },
      { url: "/favicon-v8.ico", sizes: "any" },
      {
        url: "/brand/favicon-32x32.png",
        type: "image/png",
        sizes: "32x32"
      },
      {
        url: "/icon-192.png",
        type: "image/png",
        sizes: "192x192"
      }
    ],
    shortcut: "/favicon-v8.ico",
    apple: "/apple-touch-icon.png?v=20260715-8",
    other: [
      {
        rel: "mask-icon",
        url: "/safari-pinned-tab.svg",
        color: "#4cc9f0"
      }
    ]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="font-sans">
        <LanguageProvider>
          <div className="min-h-screen bg-jam-ink text-white">
            <SiteHeader />
            <main>{children}</main>
            <SiteFooter />
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
