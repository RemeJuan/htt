import { StateCard } from "@/components/ui/state-card";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <StateCard
      icon={<span aria-hidden="true">○</span>}
      title={title}
      description={description}
      action={action}
    />
  );
}
