"use client";

import { useActionState } from "react";
import { submitContact } from "@/lib/forms/actions";
import { initialFormState } from "@/lib/forms/types";
import { btn } from "@/components/ui/styles";
import { Field, FormMessage, Honeypot } from "./fields";

const topics = [
  { value: "general", label: "General question" },
  { value: "original", label: "An original painting" },
  { value: "order", label: "An existing order" },
  { value: "commission", label: "Commissions" },
  { value: "press", label: "Press, galleries & wholesale" },
];

export function ContactForm({ defaultTopic = "general" }: { defaultTopic?: string }) {
  const [state, action, pending] = useActionState(submitContact, initialFormState);

  if (state.status === "success") return <FormMessage state={state} />;

  return (
    <form action={action} className="relative space-y-5" noValidate>
      <Honeypot />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="name" label="Your name" state={state} required autoComplete="name" />
        <Field name="email" label="Email" type="email" state={state} required autoComplete="email" />
      </div>
      <Field name="topic" label="What's this about?" state={state} required>
        {(p) => (
          <select {...p} defaultValue={p.defaultValue ?? defaultTopic}>
            {topics.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        )}
      </Field>
      <Field name="message" label="Message" state={state} required>
        {(p) => <textarea {...p} rows={6} />}
      </Field>
      <FormMessage state={state} />
      <button type="submit" className={btn("primary")} disabled={pending}>
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
