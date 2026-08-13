import { MarketplacePageContent } from "@/components/marketplace-page-content";

type ServicesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ServicesPage({ searchParams }: ServicesPageProps) {
  return (
    <MarketplacePageContent
      mode="services"
      initialQuery={getSearchQuery(await searchParams)}
    />
  );
}

function getSearchQuery(searchParams: Record<string, string | string[] | undefined> | undefined) {
  const value = searchParams?.q;
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}
