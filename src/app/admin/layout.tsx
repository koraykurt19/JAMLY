import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export const metadata: Metadata = {
  title: "Jamly Admin",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

/**
 * Server-side gate for the whole admin surface.
 *
 * Previously /admin rendered unconditionally and relied on the API returning
 * 403 — which was safe for data but shipped the console to everyone and gave
 * no redirect. Data access is still enforced by RLS and by requireCapability
 * on every route; this is the outer boundary.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const client = await getSupabaseServerClient();

  // Without Supabase there is no admin to authenticate; the console would have
  // nothing to show, so send visitors to the public site.
  if (!client) redirect("/");

  const {
    data: { user }
  } = await client.auth.getUser();

  if (!user) redirect("/auth/sign-in?next=%2Fadmin");

  const { data: isAdmin } = await client.rpc("is_current_user_admin");
  if (!isAdmin) redirect("/");

  const { data: role } = await client.rpc("current_admin_role");

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
      <AdminNav role={role ?? null} />
      <div className="mt-6">{children}</div>
    </div>
  );
}
