import { StateCard } from "@/components/ui/state-card";

type LoadingStateProps = {
  title?: string;
  description?: string;
};

export function LoadingState({
  title = "Loading",
  description = "Fetching content.",
}: LoadingStateProps) {
  return (
    <StateCard
      icon={<span className="inline-flex size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      title={title}
      description={description}
    />
  );
}
