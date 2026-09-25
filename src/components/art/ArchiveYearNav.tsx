import Link from "next/link";

/** Row of year links for flipping through the Archive, oldest first. */
export function ArchiveYearNav({ years, current }: { years: number[]; current?: number }) {
  return (
    <nav aria-label="Archive years" className="flex flex-wrap gap-2">
      {[...years].sort((a, b) => a - b).map((y) => (
        <Link
          key={y}
          href={`/gallery/archive/${y}`}
          aria-current={y === current ? "page" : undefined}
          className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
            y === current ? "border-teal bg-teal text-white" : "border-line bg-paper text-ink hover:border-teal"
          }`}
        >
          {y}
        </Link>
      ))}
    </nav>
  );
}
