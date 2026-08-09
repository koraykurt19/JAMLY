import { MarketplacePageContent } from "@/components/marketplace-page-content";

type DiscoverPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function DiscoverPage({ searchParams }: DiscoverPageProps) {
  return (
    <MarketplacePageContent
      mode="discover"
      initialQuery={getSearchQuery(searchParams)}
    />
  );
}

function getSearchQuery(searchParams: DiscoverPageProps["searchParams"]) {
  const value = searchParams?.q;
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}
