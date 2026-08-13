import { MarketplacePageContent } from "@/components/marketplace-page-content";

type MarketplacePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MarketplacePage({ searchParams }: MarketplacePageProps) {
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
