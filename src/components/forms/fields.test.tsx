/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { initialFormState, type FormState } from "@/lib/forms/types";
import { Field, FormMessage, Honeypot } from "./fields";

const errorState: FormState = {
  status: "error",
  message: "Please check the highlighted fields.",
  errors: { email: "Please enter a valid email address." },
  values: { email: "not-an-email", notes: "Hello" },
};

describe("Field", () => {
  it("renders a labelled input with extra input props", () => {
    render(<Field name="email" label="Email" type="email" state={initialFormState} required autoComplete="email" />);
    const input = screen.getByRole("textbox", { name: "Email" });
    expect(input).toHaveAttribute("id", "field-email");
    expect(input).toHaveAttribute("name", "email");
    expect(input).toHaveAttribute("type", "email");
    expect(input).toHaveAttribute("autocomplete", "email");
    expect(input).toBeRequired();
    expect(input).toHaveAttribute("aria-invalid", "false");
    expect(input).not.toHaveAttribute("aria-describedby");
    expect(input).toHaveValue("");
  });

  it("marks optional fields", () => {
    render(<Field name="colors" label="Colors" state={initialFormState} />);
    expect(screen.getByText("(optional)")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /^Colors/ })).not.toBeRequired();
  });

  it("links the hint for screen readers", () => {
    render(<Field name="subject" label="Subject" state={initialFormState} hint="Tell the story." />);
    const input = screen.getByRole("textbox", { name: /^Subject/ });
    expect(input).toHaveAttribute("aria-describedby", "field-subject-hint");
    expect(input).toHaveAccessibleDescription("Tell the story.");
  });

  it("shows the error, marks the input invalid and keeps the submitted value", () => {
    render(<Field name="email" label="Email" state={errorState} hint="We never share it." required />);
    const input = screen.getByRole("textbox", { name: "Email" });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "field-email-hint field-email-error");
    expect(input).toHaveAccessibleDescription("We never share it. Please enter a valid email address.");
    expect(input).toHaveClass("border-terracotta-dark");
    expect(input).toHaveValue("not-an-email");
  });

  it("describes only the error when there is no hint", () => {
    render(<Field name="email" label="Email" state={errorState} required />);
    expect(screen.getByRole("textbox", { name: "Email" })).toHaveAttribute("aria-describedby", "field-email-error");
  });

  it("hands the wiring to a custom control", () => {
    render(
      <Field name="notes" label="Notes" state={errorState}>
        {(p) => <textarea {...p} rows={3} />}
      </Field>,
    );
    const textarea = screen.getByRole("textbox", { name: /^Notes/ });
    expect(textarea.tagName).toBe("TEXTAREA");
    expect(textarea).toHaveValue("Hello");
    expect(textarea).toHaveAttribute("aria-invalid", "false");
  });
});

describe("Honeypot", () => {
  it("is hidden from people and out of the tab order", () => {
    const { container } = render(<Honeypot />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    const trap = container.querySelector('input[name="website"]');
    expect(trap).toHaveAttribute("tabindex", "-1");
  });
});

describe("FormMessage", () => {
  it("shows nothing before submitting", () => {
    const { container } = render(<FormMessage state={initialFormState} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows nothing when there is no message", () => {
    const { container } = render(<FormMessage state={{ status: "success" }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("announces success as a status", () => {
    render(<FormMessage state={{ status: "success", message: "Thanks!" }} />);
    expect(screen.getByRole("status")).toHaveTextContent("Thanks!");
  });

  it("announces errors as an alert", () => {
    render(<FormMessage state={errorState} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Please check the highlighted fields.");
  });
});
