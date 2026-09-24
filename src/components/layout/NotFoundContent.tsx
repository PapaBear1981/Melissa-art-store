import Link from "next/link";
import { btn, container } from "@/components/ui/styles";

export function NotFoundContent() {
  return (
    <div className={`${container} py-24 text-center`}>
      <p className="font-display text-7xl text-marigold">404</p>
      <h1 className="mt-4 font-display text-3xl">This canvas is blank</h1>
      <p className="mt-3 text-muted">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/gallery" className={btn("primary")}>View the gallery</Link>
        <Link href="/" className={btn("outline")}>Go home</Link>
      </div>
    </div>
  );
}
