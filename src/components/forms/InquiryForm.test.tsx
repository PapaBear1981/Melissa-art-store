/** @vitest-environment jsdom */
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { submitInquiry } from "@/lib/forms/actions";
import type { FormState } from "@/lib/forms/types";
import { InquiryForm } from "./InquiryForm";

vi.mock("@/lib/forms/actions", () => ({ submitInquiry: vi.fn() }));

const submit = () => userEvent.click(screen.getByRole("button", { name: "Send inquiry" }));

describe("InquiryForm", () => {
  it("sends the details with the painting's title", async () => {
    vi.mocked(submitInquiry).mockResolvedValue({
      status: "success",
      message: "Thanks for your interest!",
    });
    render(<InquiryForm artworkTitle="Tidewater" />);
    expect(screen.getByRole("textbox", { name: /^Questions or notes/ })).toHaveAttribute(
      "placeholder",
      "I'm interested in “Tidewater”…",
    );

    await userEvent.type(screen.getByRole("textbox", { name: "Your name" }), "Ana");
    await userEvent.type(screen.getByRole("textbox", { name: "Email" }), "ana@example.com");
    await userEvent.type(screen.getByRole("textbox", { name: "Shipping to (city, country)" }), "Lisbon, Portugal");
    await userEvent.type(screen.getByRole("textbox", { name: /^Questions or notes/ }), "Is it framed?");
    await submit();

    const [prev, data] = vi.mocked(submitInquiry).mock.calls[0];
    expect(prev).toEqual({ status: "idle" });
    expect(Object.fromEntries(data as FormData)).toEqual({
      website: "",
      artwork: "Tidewater",
      name: "Ana",
      email: "ana@example.com",
      country: "Lisbon, Portugal",
      message: "Is it framed?",
    });
    expect(screen.getByRole("status")).toHaveTextContent("Thanks for your interest!");
    expect(screen.queryByRole("button", { name: "Send inquiry" })).not.toBeInTheDocument();
  });

  it("highlights field errors and keeps what was typed", async () => {
    vi.mocked(submitInquiry).mockResolvedValue({
      status: "error",
      message: "Please check the highlighted fields.",
      errors: { country: "Please tell us where the painting would ship to." },
      values: { name: "Ana", email: "ana@example.com", country: "", message: "Hi" },
    });
    render(<InquiryForm artworkTitle="Tidewater" />);
    await submit();

    expect(screen.getByRole("alert")).toHaveTextContent("Please check the highlighted fields.");
    const country = screen.getByRole("textbox", { name: "Shipping to (city, country)" });
    expect(country).toHaveAttribute("aria-invalid", "true");
    expect(country).toHaveAccessibleDescription("Please tell us where the painting would ship to.");
    expect(screen.getByRole("textbox", { name: "Your name" })).toHaveValue("Ana");
    expect(screen.getByRole("textbox", { name: "Your name" })).toHaveAttribute("aria-invalid", "false");
    expect(screen.getByRole("textbox", { name: "Email" })).toHaveValue("ana@example.com");
    expect(screen.getByRole("textbox", { name: /^Questions or notes/ })).toHaveValue("Hi");
  });

  it("disables the button while sending", async () => {
    let resolve!: (s: FormState) => void;
    vi.mocked(submitInquiry).mockReturnValue(new Promise((r) => (resolve = r)));
    render(<InquiryForm artworkTitle="Tidewater" />);
    await submit();
    expect(screen.getByRole("button", { name: "Sending…" })).toBeDisabled();
    await act(async () => resolve({ status: "success", message: "Sent" }));
    expect(screen.getByRole("status")).toHaveTextContent("Sent");
  });
});
