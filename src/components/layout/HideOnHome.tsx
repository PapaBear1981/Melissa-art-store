"use client";

import { usePathname } from "next/navigation";

/** Renders its children everywhere except the home page, which fits on one screen. */
export function HideOnHome({ children }: { children: React.ReactNode }) {
  return usePathname() === "/" ? null : children;
}
