import { LoadingState } from "@/components/ui/loading-state";

export default function ListingLoading() {
  return <div className="py-6 sm:py-8 lg:py-10"><LoadingState title="Loading listing" description="Fetching public listing details." /></div>;
}
