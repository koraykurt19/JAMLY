import { MarketplacePageContent } from "@/components/marketplace-page-content";

type BeatsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BeatsPage({ searchParams }: BeatsPageProps) {
  return (
    <MarketplacePageContent
      mode="beats"
      initialQuery={getSearchQuery(await searchParams)}
    />
  );
}

function getSearchQuery(searchParams: Record<string, string | string[] | undefined> | undefined) {
  const value = searchParams?.q;
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}
