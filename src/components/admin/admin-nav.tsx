"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/language-provider";
import { Pill } from "@/components/ui/surface";
import {
  adminRoleLabels,
  roleHas,
  type AdminCapability,
  type AdminRole
} from "@/lib/admin-client";
import { cn } from "@/lib/format";

type NavItem = {
  href: string;
  labelTr: string;
  labelEn: string;
  capability: AdminCapability;
};

const navItems: NavItem[] = [
  { href: "/admin", labelTr: "Genel bakış", labelEn: "Overview", capability: "user.view" },
  { href: "/admin/waitlist", labelTr: "Erken kayıt", labelEn: "Waitlist", capability: "waitlist.manage" },
  { href: "/admin/reports", labelTr: "Raporlar", labelEn: "Reports", capability: "report.resolve" },
  { href: "/admin/badges", labelTr: "Rozetler", labelEn: "Badges", capability: "badge.manage" },
  { href: "/admin/retention", labelTr: "Veri koruma", labelEn: "Retention", capability: "admin.manage" },
  { href: "/admin/audit", labelTr: "Denetim kaydı", labelEn: "Audit log", capability: "audit.view" }
];

/**
 * Navigation reflects the caller's role, but hiding a link is not access
 * control; every destination re-checks the capability server-side.
 */
export function AdminNav({ role }: { role: AdminRole | null }) {
  const pathname = usePathname();
  const { language } = useI18n();
  const visible = navItems.filter((item) => roleHas(role, item.capability));

  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {language === "tr" ? "Yönetim konsolu" : "Admin console"}
          </h1>
          <p className="mt-1 text-[13px] text-white/52">
            {language === "tr"
              ? "Tüm hassas işlemler denetim kaydına yazılır."
              : "Every sensitive action is written to the audit log."}
          </p>
        </div>
        {role ? <Pill tone="brand">{adminRoleLabels[language][role]}</Pill> : null}
      </div>

      <nav aria-label={language === "tr" ? "Yönetim bölümleri" : "Admin sections"}>
        <ul className="flex flex-wrap gap-1.5 border-b border-white/8 pb-3">
          {visible.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "focus-ring inline-flex min-h-control items-center rounded-md px-3.5 text-[13px] font-semibold transition",
                    active
                      ? "bg-jam-blue/14 text-jam-mint"
                      : "text-white/58 hover:bg-white/[0.06] hover:text-white"
                  )}
                >
                  {language === "tr" ? item.labelTr : item.labelEn}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
