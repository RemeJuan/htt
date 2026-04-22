type StateCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function StateCard({ icon, title, description, action }: StateCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-lg text-accent-foreground">
          {icon}
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-card-foreground">{title}</h2>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
          {action ? <div className="pt-1">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}
