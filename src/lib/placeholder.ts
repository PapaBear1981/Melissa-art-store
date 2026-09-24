import type { PlaceholderArt } from "./types";

const palettes = [
  ["#f6c177", "#e9a23b", "#c8553d", "#8f2d56", "#3d1e3f"],
  ["#fbe3c8", "#f2a65a", "#2a9d8f", "#1f6f6b", "#264653"],
  ["#fde2e4", "#f4978e", "#e56b6f", "#6a994e", "#386641"],
  ["#fff3b0", "#e9c46a", "#f4a261", "#e76f51", "#6b2d5c"],
  ["#f3d9c9", "#d8a7b1", "#b56576", "#6b2d5c", "#355070"],
  ["#f1faee", "#e9d8a6", "#ee9b00", "#94d2bd", "#005f73"],
] as const;

const styles: PlaceholderArt["style"][] = ["abstract", "landscape", "floral"];

/** A stable, colorful stand-in picture for a painting that has no photo yet. */
export function placeholderFor(key: string): PlaceholderArt {
  let hash = 0;
  for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return {
    seed: hash % 10000,
    palette: palettes[hash % palettes.length],
    style: styles[(hash >>> 4) % styles.length],
  };
}
