"use client";

import { useActionState } from "react";
import { submitInquiry } from "@/lib/forms/actions";
import { initialFormState } from "@/lib/forms/types";
import { btn } from "@/components/ui/styles";
import { Field, FormMessage, Honeypot } from "./fields";

export function InquiryForm({ artworkTitle }: { artworkTitle: string }) {
  const [state, action, pending] = useActionState(submitInquiry, initialFormState);

  if (state.status === "success") return <FormMessage state={state} />;

  return (
    <form action={action} className="relative space-y-4" noValidate>
      <Honeypot />
      <input type="hidden" name="artwork" value={artworkTitle} />
      <Field name="name" label="Your name" state={state} required autoComplete="name" />
      <Field name="email" label="Email" type="email" state={state} required autoComplete="email" />
      <Field name="country" label="Shipping to (city, country)" state={state} required autoComplete="country-name" />
      <Field name="message" label="Questions or notes" state={state}>
        {(p) => <textarea {...p} rows={4} placeholder={`I'm interested in “${artworkTitle}”…`} />}
      </Field>
      <FormMessage state={state} />
      <button type="submit" className={`${btn("primary")} w-full`} disabled={pending}>
        {pending ? "Sending…" : "Send inquiry"}
      </button>
    </form>
  );
}
