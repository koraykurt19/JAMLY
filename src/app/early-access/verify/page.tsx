import type { Metadata } from "next";
import { EarlyAccessVerify } from "@/components/early-access-verify";

export const metadata: Metadata = {
  title: "Jamly — Erken kayıt doğrulama",
  robots: { index: false, follow: false }
};

export default async function EarlyAccessVerifyRoute({
  searchParams
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;
  const value = Array.isArray(token) ? token[0] : token;
  return <EarlyAccessVerify token={value ?? ""} />;
}
