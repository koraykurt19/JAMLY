import { MarketplacePageContent } from "@/components/marketplace-page-content";

type BeatsPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function BeatsPage({ searchParams }: BeatsPageProps) {
  return (
    <MarketplacePageContent
      mode="beats"
      initialQuery={getSearchQuery(searchParams)}
    />
  );
}

function getSearchQuery(searchParams: BeatsPageProps["searchParams"]) {
  const value = searchParams?.q;
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}
