import { StateCard } from "@/components/ui/state-card";

type EmptyStateProps = {
  eyebrow?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
};

export function EmptyState({
  eyebrow,
  title,
  description,
  action,
  primaryAction,
  secondaryAction,
}: EmptyStateProps) {
  const actions =
    primaryAction || secondaryAction ? (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {primaryAction}
        {secondaryAction}
      </div>
    ) : (
      action
    );

  return (
    <StateCard
      icon={<span aria-hidden="true">○</span>}
      eyebrow={eyebrow}
      title={title}
      description={description}
      action={actions}
    />
  );
}
