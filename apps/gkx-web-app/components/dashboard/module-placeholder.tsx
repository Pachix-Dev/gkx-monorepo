type ModulePlaceholderProps = {
  title: string;
  description: string;
  endpoint?: string;
};

export function ModulePlaceholder({ title, description, endpoint }: ModulePlaceholderProps) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-card-foreground">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {endpoint ? (
        <p className="mt-4 inline-flex rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
          API: {endpoint}
        </p>
      ) : null}
    </section>
  );
}
