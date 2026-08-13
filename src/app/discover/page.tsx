import { MarketplacePageContent } from "@/components/marketplace-page-content";

type DiscoverPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
  return (
    <MarketplacePageContent
      mode="discover"
      initialQuery={getSearchQuery(await searchParams)}
    />
  );
}

function getSearchQuery(searchParams: Record<string, string | string[] | undefined> | undefined) {
  const value = searchParams?.q;
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}
