import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LanguageProvider } from "@/components/language-provider";
import { NavigationPerformance } from "@/components/navigation-performance";
import { AudioPlayerProvider } from "@/components/audio-player-provider";

export const metadata: Metadata = {
  title: "Jamly - Müzik üreticileri Jam Alanı",
  description:
    "Beat, hook, miks ve özel prodüksiyon işleri için premium müzik üreticileri Jam Alanı.",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-v10.svg", type: "image/svg+xml" },
      { url: "/favicon-v10.ico", sizes: "any" },
      {
        url: "/brand/favicon-32x32.png",
        type: "image/png",
        sizes: "32x32"
      },
      {
        url: "/icon-192-v10.png",
        type: "image/png",
        sizes: "192x192"
      }
    ],
    shortcut: "/favicon-v10.ico",
    apple: "/apple-touch-icon-v10.png",
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
          <AudioPlayerProvider>
            <div className="min-h-screen bg-jam-ink text-white">
              <Suspense fallback={null}>
                <NavigationPerformance />
              </Suspense>
              <SiteHeader />
              <main>{children}</main>
              <SiteFooter />
            </div>
          </AudioPlayerProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
