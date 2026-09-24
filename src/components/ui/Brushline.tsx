/** Decorative painted underline used under section titles. */
export function Brushline({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 12"
      className={`h-3 w-24 ${className}`}
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <path
        d="M2 8 C 40 2, 80 11, 120 6 S 180 3, 198 7"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
