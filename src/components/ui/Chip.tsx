export function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
        active
          ? "border-teal bg-teal text-white"
          : "border-line bg-paper text-ink hover:border-teal"
      }`}
    >
      {children}
    </button>
  );
}
