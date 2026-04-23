import { LoadingState } from "@/components/ui/loading-state";

export default function Loading() {
  return (
    <div className="py-6 sm:py-8 lg:py-10">
      <LoadingState title="Sending reset link" description="Please wait..." />
    </div>
  );
}
