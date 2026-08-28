import type { Metadata } from "next";
import { headers } from "next/headers";
import { Suspense, type ReactNode } from "react";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PreRegisterFooter, PreRegisterHeader } from "@/components/pre-register-chrome";
import { LanguageProvider } from "@/components/language-provider";
import { NavigationPerformance } from "@/components/navigation-performance";
import { AudioPlayerProvider } from "@/components/audio-player-provider";
import { ClientRuntimeRecovery } from "@/components/client-runtime-recovery";

export const metadata: Metadata = {
  title: "Jamly - Müzik üreticileri Jam Alanı",
  description:
    "Beat, hook, miks ve özel prodüksiyon işleri için premium müzik üreticileri Jam Alanı.",
  manifest: "/site.webmanifest?v=20260809-2",
  icons: {
    icon: [
      { url: "/favicon-v12.svg?v=20260809-2", type: "image/svg+xml" },
      { url: "/favicon-v12.ico?v=20260809-2", sizes: "any" },
      {
        url: "/brand/favicon-32x32.png?v=20260809-2",
        type: "image/png",
        sizes: "32x32"
      },
      {
        url: "/icon-192-v12.png?v=20260809-2",
        type: "image/png",
        sizes: "192x192"
      }
    ],
    shortcut: "/favicon-v12.ico?v=20260809-2",
    apple: "/apple-touch-icon-v12.png?v=20260809-2",
    other: [
      {
        rel: "mask-icon",
        url: "/safari-pinned-tab.svg",
        color: "#4cc9f0"
      }
    ]
  }
};

export default async function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const requestHeaders = await headers();
  const host = normalizeHost(requestHeaders.get("host"));
  const preRegisterHosts = hostList(process.env.JAMLY_PRE_REGISTER_HOSTS, [
    "pre-register.getjamly.com"
  ]);
  const isPreRegisterHost = preRegisterHosts.has(host);

  return (
    <html lang="tr">
      <body className="font-sans">
        <ClientRuntimeRecovery />
        <LanguageProvider>
          <AudioPlayerProvider>
            <div className="min-h-screen bg-jam-ink text-white">
              <Suspense fallback={null}>
                <NavigationPerformance />
              </Suspense>
              {isPreRegisterHost ? <PreRegisterHeader /> : <SiteHeader />}
              <main>{children}</main>
              {isPreRegisterHost ? <PreRegisterFooter /> : <SiteFooter />}
            </div>
          </AudioPlayerProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

function normalizeHost(value: string | null) {
  return (value ?? "").split(":")[0]?.toLowerCase() ?? "";
}

function hostList(value: string | undefined, fallback: string[]) {
  return new Set(
    (value?.split(",") ?? fallback)
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
  );
}
