import Link from "next/link";
import { Brushline } from "./Brushline";

export function SectionHeading({
  title,
  href,
  linkLabel,
  color = "text-marigold",
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  color?: string;
}) {
  return (
    <div className="mb-10 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-3xl sm:text-4xl">{title}</h2>
        <Brushline className={`mt-1 ${color}`} />
      </div>
      {href && (
        <Link href={href} className="shrink-0 text-sm font-semibold text-teal underline-offset-4 hover:underline">
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}
