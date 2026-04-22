import { LoadingState } from "@/components/ui/loading-state";

export default function ListingsLoading() {
  return <LoadingState title="Loading listings" description="Fetching published listings." />;
}
