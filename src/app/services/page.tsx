import { MarketplacePageContent } from "@/components/marketplace-page-content";

type ServicesPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function ServicesPage({ searchParams }: ServicesPageProps) {
  return (
    <MarketplacePageContent
      mode="services"
      initialQuery={getSearchQuery(searchParams)}
    />
  );
}

function getSearchQuery(searchParams: ServicesPageProps["searchParams"]) {
  const value = searchParams?.q;
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}
