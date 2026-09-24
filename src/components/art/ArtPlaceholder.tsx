import type { PlaceholderArt } from "@/lib/types";

/**
 * Draws a painterly stand-in image from a seed so the site looks real
 * before actual scans are uploaded. Same seed → same picture.
 */

function rng(seed: number) {
  let t = seed * 9973;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

type Rand = ReturnType<typeof rng>;
type SceneProps = { r: Rand; w: number; h: number; p: readonly string[]; id: string };

const pick = <T,>(r: Rand, list: readonly T[]) =>
  list[Math.floor(r() * list.length)];

function brushStroke(r: Rand, w: number, h: number) {
  const x = r() * w;
  const y = r() * h;
  const len = (0.2 + r() * 0.4) * w;
  const angle = (r() - 0.5) * Math.PI * 0.6;
  const dx = Math.cos(angle) * len;
  const dy = Math.sin(angle) * len;
  const bend = (r() - 0.5) * h * 0.2;
  return `M${x} ${y} q${dx / 2} ${dy / 2 + bend} ${dx} ${dy}`;
}

function Landscape({ r, w, h, p, id }: SceneProps) {
  const layers = 4;
  const hills = Array.from({ length: layers }, (_, i) => {
    const base = h * (0.45 + (i * 0.5) / layers);
    const pts = Array.from({ length: 5 }, (_, j) => {
      const x = (w / 4) * j;
      const y = base - r() * h * 0.12;
      return `${x} ${y}`;
    });
    return {
      d: `M0 ${h} L${pts.join(" L")} L${w} ${h} Z`,
      fill: p[Math.min(p.length - 1, i + 1)],
    };
  });
  return (
    <>
      <rect width={w} height={h} fill={`url(#${id}-sky)`} />
      <circle cx={w * (0.2 + r() * 0.6)} cy={h * (0.2 + r() * 0.15)} r={Math.min(w, h) * 0.12} fill={p[0]} opacity={0.95} />
      {hills.map((hill, i) => (
        <path key={i} d={hill.d} fill={hill.fill} />
      ))}
    </>
  );
}

function Abstract({ r, w, h, p }: SceneProps) {
  return (
    <>
      <rect width={w} height={h} fill={p[0]} />
      {Array.from({ length: 9 }, (_, i) => (
        <ellipse
          key={i}
          cx={r() * w}
          cy={r() * h}
          rx={(0.15 + r() * 0.3) * w}
          ry={(0.08 + r() * 0.2) * h}
          fill={pick(r, p.slice(1))}
          opacity={0.75 + r() * 0.25}
          transform={`rotate(${r() * 180} ${w / 2} ${h / 2})`}
        />
      ))}
      {Array.from({ length: 7 }, (_, i) => (
        <path
          key={`s${i}`}
          d={brushStroke(r, w, h)}
          stroke={pick(r, p)}
          strokeWidth={Math.min(w, h) * (0.02 + r() * 0.05)}
          strokeLinecap="round"
          fill="none"
        />
      ))}
    </>
  );
}

function Floral({ r, w, h, p }: SceneProps) {
  const size = Math.min(w, h);
  const flowers = Array.from({ length: 6 }, () => ({
    x: w * (0.15 + r() * 0.7),
    y: h * (0.15 + r() * 0.55),
    s: size * (0.08 + r() * 0.08),
    color: pick(r, p.slice(1, 3)),
    rot: r() * 60,
  }));
  return (
    <>
      <rect width={w} height={h} fill={p[0]} />
      {flowers.map((f, i) => (
        <path
          key={`stem${i}`}
          d={`M${f.x} ${f.y} q${(r() - 0.5) * w * 0.2} ${h * 0.3} ${(r() - 0.5) * w * 0.1} ${h}`}
          stroke={p[3]}
          strokeWidth={size * 0.015}
          fill="none"
        />
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <ellipse
          key={`leaf${i}`}
          cx={w * (0.1 + r() * 0.8)}
          cy={h * (0.55 + r() * 0.4)}
          rx={size * 0.1}
          ry={size * 0.035}
          fill={pick(r, p.slice(3))}
          transform={`rotate(${(r() - 0.5) * 120} ${w / 2} ${h * 0.75})`}
        />
      ))}
      {flowers.map((f, i) => (
        <g key={`flower${i}`} transform={`translate(${f.x} ${f.y}) rotate(${f.rot})`}>
          {Array.from({ length: 6 }, (_, k) => (
            <ellipse key={k} cx={0} cy={-f.s * 0.6} rx={f.s * 0.45} ry={f.s * 0.7} fill={f.color} opacity={0.9} transform={`rotate(${k * 60})`} />
          ))}
          <circle r={f.s * 0.3} fill={p[4] ?? p[0]} />
        </g>
      ))}
    </>
  );
}

export function ArtPlaceholder({
  art,
  widthIn,
  heightIn,
  className,
  title,
}: {
  art: PlaceholderArt;
  widthIn: number;
  heightIn: number;
  className?: string;
  title: string;
}) {
  const scale = 1000 / Math.max(widthIn, heightIn);
  const w = Math.round(widthIn * scale);
  const h = Math.round(heightIn * scale);
  const r = rng(art.seed);
  const p = art.palette;
  const id = `art-${art.seed}-${w}-${h}`;
  const Scene = { landscape: Landscape, abstract: Abstract, floral: Floral }[art.style];

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role="img"
      aria-label={`${title} (placeholder image)`}
    >
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p[1]} />
          <stop offset="1" stopColor={p[0]} />
        </linearGradient>
        <filter id={`${id}-paint`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" seed={art.seed} />
          <feDisplacementMap in="SourceGraphic" scale={28} />
        </filter>
        <filter id={`${id}-grain`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={art.seed} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>
      <g filter={`url(#${id}-paint)`}>
        <Scene r={r} w={w} h={h} p={p} id={id} />
      </g>
      <rect width={w} height={h} filter={`url(#${id}-grain)`} opacity={0.08} style={{ mixBlendMode: "multiply" }} />
    </svg>
  );
}
