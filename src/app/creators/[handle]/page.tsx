import { notFound } from "next/navigation";
import { CreatorProfileView } from "@/components/creator-profile-view";
import { getCreatorByHandle, getCreatorListings } from "@/lib/data";

type CreatorProfilePageProps = {
  params: {
    handle: string;
  };
};

export default function CreatorProfilePage({ params }: CreatorProfilePageProps) {
  const creator = getCreatorByHandle(params.handle);

  if (!creator) {
    notFound();
  }

  const creatorListings = getCreatorListings(creator.id);

  return <CreatorProfileView creator={creator} listings={creatorListings} />;
}
