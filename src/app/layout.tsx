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
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      {
        url: "/brand/jamly-tab-icon-20260715-v2.png",
        type: "image/png",
        sizes: "1024x1024"
      }
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png"
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
