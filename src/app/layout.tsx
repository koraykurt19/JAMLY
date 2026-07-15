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
      { url: "/favicon.svg?v=20260715-5", type: "image/svg+xml" },
      { url: "/favicon-v5.ico", sizes: "any" },
      {
        url: "/brand/jamly-tab-mark-20260715-v5.png",
        type: "image/png",
        sizes: "1024x1024"
      }
    ],
    shortcut: "/favicon-v5.ico",
    apple: "/apple-touch-icon.png?v=20260715-5"
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
