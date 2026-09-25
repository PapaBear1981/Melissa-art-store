import { Fragment } from "react";
import { input, label as labelClass } from "@/components/ui/styles";
import type { FormState } from "@/lib/forms/types";

type FieldProps = {
  name: string;
  label: string;
  state: FormState;
  hint?: string;
  required?: boolean;
  children?: (props: {
    id: string;
    name: string;
    className: string;
    "aria-invalid": boolean;
    "aria-describedby"?: string;
    required?: boolean;
    defaultValue?: string;
  }) => React.ReactNode;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name" | "children">;

/** Label + input + error message, wired up for screen readers. */
export function Field({ name, label, state, hint, required, children, ...rest }: FieldProps) {
  const id = `field-${name}`;
  const error = state.errors?.[name];
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  const controlProps = {
    id,
    name,
    className: `${input} ${error ? "border-terracotta-dark" : ""}`,
    "aria-invalid": Boolean(error),
    "aria-describedby": describedBy,
    required,
    defaultValue: state.values?.[name],
  };

  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
        {!required && <span className="font-normal text-muted"> (optional)</span>}
      </label>
      {children ? (
        // A <select> only reads defaultValue when it mounts, so remount it to
        // show the value sent back after a failed submit.
        <Fragment key={controlProps.defaultValue}>{children(controlProps)}</Fragment>
      ) : (
        <input {...controlProps} {...rest} />
      )}
      {hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-terracotta-dark">
          {error}
        </p>
      )}
    </div>
  );
}

/** Invisible field that catches spam bots. */
export function Honeypot() {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        Leave this empty
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  if (state.status === "idle" || !state.message) return null;
  const ok = state.status === "success";
  return (
    <p
      role={ok ? "status" : "alert"}
      className={`rounded-lg px-4 py-3 text-sm ${ok ? "bg-teal/10 text-teal-dark" : "bg-terracotta/10 text-terracotta-dark"}`}
    >
      {state.message}
    </p>
  );
}
