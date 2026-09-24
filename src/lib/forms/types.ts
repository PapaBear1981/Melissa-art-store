export type FormState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Record<string, string>;
  /** Submitted values, so fields keep their contents after a failed submit. */
  values?: Record<string, string>;
};

export const initialFormState: FormState = { status: "idle" };
