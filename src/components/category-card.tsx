import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";

export function CategoryCard({
  href,
  title,
  description,
  icon: Icon,
  accent = "blue"
}: {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accent?: "blue" | "cyan";
}) {
  return (
    <Link
      href={href}
      className="focus-ring group flex min-h-40 flex-col justify-between rounded-lg border border-white/[0.09] bg-[#121722] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-jam-blue/45 hover:bg-[#151b27]"
    >
      <div className="flex items-start justify-between gap-4">
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-md border ${
            accent === "cyan"
              ? "border-jam-mint/24 bg-jam-mint/10 text-jam-mint"
              : "border-jam-blue/24 bg-jam-blue/10 text-jam-blue"
          }`}
        >
          <Icon size={20} />
        </span>
        <ArrowUpRight
          size={18}
          className="text-white/28 transition group-hover:text-white/74"
        />
      </div>
      <div className="mt-6">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <p className="mt-1.5 text-sm leading-5 text-white/46">{description}</p>
      </div>
    </Link>
  );
}
