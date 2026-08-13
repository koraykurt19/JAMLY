import type { Metadata } from "next";
import { EarlyAccessPage } from "@/components/early-access-page";
import { earlyAccessCopy } from "@/lib/early-access-copy";

export const metadata: Metadata = {
  title: earlyAccessCopy.tr.metaTitle,
  description: earlyAccessCopy.tr.metaDescription,
  alternates: { canonical: "/early-access" },
  openGraph: {
    type: "website",
    url: "/early-access",
    title: earlyAccessCopy.tr.metaTitle,
    description: earlyAccessCopy.tr.metaDescription,
    siteName: "Jamly"
  },
  twitter: {
    card: "summary_large_image",
    title: earlyAccessCopy.tr.metaTitle,
    description: earlyAccessCopy.tr.metaDescription
  }
};

export default function EarlyAccessRoute() {
  return <EarlyAccessPage />;
}
