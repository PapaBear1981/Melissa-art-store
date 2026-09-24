/** Shared class names so buttons and links look the same everywhere. */
export const button = {
  base: "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-50",
  primary: "bg-terracotta-dark text-white hover:bg-terracotta",
  secondary: "bg-teal text-white hover:bg-teal-dark",
  outline: "border border-ink/20 bg-paper text-ink hover:border-ink/50",
};

export const btn = (variant: "primary" | "secondary" | "outline" = "primary") =>
  `${button.base} ${button[variant]}`;

export const container = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8";

export const input =
  "w-full rounded-lg border border-line bg-paper px-4 py-3 text-ink placeholder:text-muted/70 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20";

export const label = "mb-1.5 block text-sm font-semibold text-ink";
