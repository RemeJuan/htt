import { LoadingState } from "@/components/ui/loading-state";

export default function ListingsLoading() {
  return (
    <div className="py-6 sm:py-8 lg:py-10">
      <LoadingState title="Loading listings" description="Fetching published listings." />
    </div>
  );
}
