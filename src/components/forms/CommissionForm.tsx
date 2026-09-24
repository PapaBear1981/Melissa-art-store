"use client";

import { useActionState } from "react";
import { submitCommission } from "@/lib/forms/actions";
import { initialFormState } from "@/lib/forms/types";
import { btn } from "@/components/ui/styles";
import { Field, FormMessage, Honeypot } from "./fields";

const commissionSizes = [
  '12″ × 12″',
  '16″ × 20″',
  '24″ × 30″',
  '30″ × 40″',
  '36″ × 48″',
  '4′ × 4′',
  '5′ × 5′',
  "Custom size",
];

const commissionBudgets = [
  "Under $500",
  "$500 – $1,500",
  "$1,500 – $3,000",
  "$3,000 – $6,000",
  "$6,000+",
  "Not sure yet",
];

export function CommissionForm() {
  const [state, action, pending] = useActionState(submitCommission, initialFormState);

  if (state.status === "success") return <FormMessage state={state} />;

  return (
    <form action={action} className="relative space-y-5" noValidate>
      <Honeypot />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="name" label="Your name" state={state} required autoComplete="name" />
        <Field name="email" label="Email" type="email" state={state} required autoComplete="email" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="size" label="Size" state={state} required>
          {(p) => (
            <select {...p} defaultValue={p.defaultValue ?? ""}>
              <option value="" disabled>Choose a size…</option>
              {commissionSizes.map((s) => <option key={s}>{s}</option>)}
            </select>
          )}
        </Field>
        <Field name="customSize" label="Custom size" state={state} placeholder='e.g. 20″ × 60″' />
      </div>

      <Field name="subject" label="What would you like painted?" state={state} required hint="A place, a person, a pet, a feeling. Tell the story behind it.">
        {(p) => <textarea {...p} rows={4} />}
      </Field>

      <Field name="colors" label="Colors or mood" state={state} placeholder="e.g. warm sunset tones to match our living room" />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="budget" label="Budget" state={state} required>
          {(p) => (
            <select {...p} defaultValue={p.defaultValue ?? ""}>
              <option value="" disabled>Choose a range…</option>
              {commissionBudgets.map((b) => <option key={b}>{b}</option>)}
            </select>
          )}
        </Field>
        <Field name="deadline" label="Needed by" state={state} placeholder="e.g. before Christmas" />
      </div>

      <Field name="shipTo" label="Shipping to (city, country)" state={state} required autoComplete="country-name" />

      <Field
        name="photos"
        label="Reference photos"
        state={state}
        hint="Up to 5 images (JPG, PNG, WEBP or HEIC), 5 MB each."
      >
        {(p) => (
          <input
            id={p.id}
            name={p.name}
            aria-invalid={p["aria-invalid"]}
            aria-describedby={p["aria-describedby"]}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            multiple
            className="block w-full text-sm text-muted file:mr-4 file:rounded-full file:border-0 file:bg-blush file:px-4 file:py-2 file:font-semibold file:text-ink hover:file:bg-line"
          />
        )}
      </Field>

      <Field name="notes" label="Anything else?" state={state}>
        {(p) => <textarea {...p} rows={3} />}
      </Field>

      <FormMessage state={state} />
      <button type="submit" className={btn("primary")} disabled={pending}>
        {pending ? "Sending…" : "Send commission request"}
      </button>
    </form>
  );
}
