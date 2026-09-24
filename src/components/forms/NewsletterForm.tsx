"use client";

import { useActionState } from "react";
import { subscribeNewsletter } from "@/lib/forms/actions";
import { initialFormState } from "@/lib/forms/types";
import { Honeypot } from "./fields";

export function NewsletterForm({ tone = "light" }: { tone?: "light" | "dark" }) {
  const [state, action, pending] = useActionState(subscribeNewsletter, initialFormState);
  const dark = tone === "dark";

  if (state.status === "success") {
    return <p role="status" className={dark ? "text-marigold" : "text-teal-dark"}>{state.message}</p>;
  }

  return (
    <form action={action} className="relative" noValidate>
      <Honeypot />
      <div className="flex gap-2">
        <label htmlFor={`newsletter-${tone}`} className="sr-only">Email address</label>
        <input
          id={`newsletter-${tone}`}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={Boolean(state.errors?.email)}
          className={`min-w-0 flex-1 rounded-full border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${
            dark
              ? "border-cream/20 bg-cream/10 text-cream placeholder:text-cream/50 focus:ring-marigold/40"
              : "border-line bg-paper text-ink focus:ring-teal/20"
          }`}
        />
        <button
          type="submit"
          disabled={pending}
          className={`rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-60 ${
            dark ? "bg-marigold text-ink hover:bg-marigold/90" : "bg-teal text-white hover:bg-teal-dark"
          }`}
        >
          {pending ? "…" : "Subscribe"}
        </button>
      </div>
      {state.errors?.email && (
        <p role="alert" className={`mt-2 text-sm ${dark ? "text-marigold" : "text-terracotta-dark"}`}>
          {state.errors.email}
        </p>
      )}
    </form>
  );
}
