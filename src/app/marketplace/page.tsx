import { MarketplacePageContent } from "@/components/marketplace-page-content";

type MarketplacePageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function MarketplacePage({ searchParams }: MarketplacePageProps) {
  return (
    <MarketplacePageContent
      mode="discover"
      initialQuery={getSearchQuery(searchParams)}
    />
  );
}

function getSearchQuery(searchParams: MarketplacePageProps["searchParams"]) {
  const value = searchParams?.q;
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}
