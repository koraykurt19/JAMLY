import { notFound } from "next/navigation";
import { ListingDetailView } from "@/components/listing-detail-view";
import { creators, getCreatorByHandle, getCreatorListings, getListingById } from "@/lib/data";

type ListingDetailPageProps = {
  params: {
    id: string;
  };
};

export default function ListingDetailPage({ params }: ListingDetailPageProps) {
  const listing = getListingById(params.id);

  if (!listing) {
    notFound();
  }

  const creator =
    getCreatorByHandle(listing.creatorHandle) ??
    creators.find((item) => item.id === listing.creatorId) ??
    null;
  const relatedListings = getCreatorListings(listing.creatorId).filter(
    (item) => item.id !== listing.id
  );

  return (
    <ListingDetailView
      listing={listing}
      creator={creator}
      relatedListings={relatedListings}
    />
  );
}
