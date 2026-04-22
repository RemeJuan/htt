import { LoadingState } from "@/components/ui/loading-state";

export default function Loading() {
  return (
    <div className="py-10 md:py-16">
      <LoadingState
        title="Loading app"
        description="Preparing layout and route content."
      />
    </div>
  );
}
