/** @vitest-environment jsdom */
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { subscribeNewsletter } from "@/lib/forms/actions";
import type { FormState } from "@/lib/forms/types";
import { NewsletterForm } from "./NewsletterForm";

vi.mock("@/lib/forms/actions", () => ({ subscribeNewsletter: vi.fn() }));

const email = () => screen.getByRole("textbox", { name: "Email address" });
const subscribe = () => userEvent.click(screen.getByRole("button", { name: "Subscribe" }));

describe("NewsletterForm", () => {
  it("subscribes the email and confirms (light tone by default)", async () => {
    vi.mocked(subscribeNewsletter).mockResolvedValue({ status: "success", message: "You're on the list!" });
    render(<NewsletterForm />);
    expect(email()).toHaveAttribute("id", "newsletter-light");
    expect(email()).toHaveAttribute("aria-invalid", "false");
    expect(email()).toHaveClass("bg-paper");

    await userEvent.type(email(), "ana@example.com");
    await subscribe();

    expect(Object.fromEntries(vi.mocked(subscribeNewsletter).mock.calls[0][1] as FormData)).toEqual({
      website: "",
      email: "ana@example.com",
    });
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("You're on the list!");
    expect(status).toHaveClass("text-teal-dark");
  });

  it("uses the dark tone colors", async () => {
    vi.mocked(subscribeNewsletter).mockResolvedValue({ status: "success", message: "You're on the list!" });
    render(<NewsletterForm tone="dark" />);
    expect(email()).toHaveAttribute("id", "newsletter-dark");
    expect(email()).toHaveClass("bg-cream/10");
    expect(screen.getByRole("button", { name: "Subscribe" })).toHaveClass("bg-marigold");
    await subscribe();
    expect(screen.getByRole("status")).toHaveClass("text-marigold");
  });

  it.each([
    ["light", "text-terracotta-dark"],
    ["dark", "text-marigold"],
  ] as const)("shows an email error in the %s tone", async (tone, color) => {
    vi.mocked(subscribeNewsletter).mockResolvedValue({
      status: "error",
      message: "Please check the highlighted fields.",
      errors: { email: "Please enter a valid email address." },
      values: { email: "nope" },
    });
    render(<NewsletterForm tone={tone} />);
    await subscribe();
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Please enter a valid email address.");
    expect(alert).toHaveClass(color);
    expect(email()).toHaveAttribute("aria-invalid", "true");
  });

  it("shows a pending state while subscribing", async () => {
    let resolve!: (s: FormState) => void;
    vi.mocked(subscribeNewsletter).mockReturnValue(new Promise((r) => (resolve = r)));
    render(<NewsletterForm />);
    await subscribe();
    expect(screen.getByRole("button", { name: "…" })).toBeDisabled();
    await act(async () => resolve({ status: "success", message: "Done" }));
    expect(screen.getByRole("status")).toHaveTextContent("Done");
  });
});
