import { container } from "./styles";

export function PageHeader({
  eyebrow,
  title,
  intro,
}: {
  eyebrow?: string;
  title: string;
  intro?: React.ReactNode;
}) {
  return (
    <header className={`${container} pt-12 pb-8 sm:pt-16`}>
      {eyebrow && (
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-terracotta-dark">
          {eyebrow}
        </p>
      )}
      <h1 className="font-display text-4xl sm:text-5xl">{title}</h1>
      {intro && <div className="mt-4 max-w-2xl text-lg text-muted">{intro}</div>}
    </header>
  );
}
