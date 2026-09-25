/** @vitest-environment jsdom */
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { submitContact } from "@/lib/forms/actions";
import type { FormState } from "@/lib/forms/types";
import { ContactForm } from "./ContactForm";

vi.mock("@/lib/forms/actions", () => ({ submitContact: vi.fn() }));

const submit = () => userEvent.click(screen.getByRole("button", { name: "Send message" }));
const topic = () => screen.getByRole("combobox", { name: "What's this about?" });

describe("ContactForm", () => {
  it("defaults the topic to a general question", () => {
    render(<ContactForm />);
    expect(topic()).toHaveValue("general");
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual([
      "General question",
      "An original painting",
      "An existing order",
      "Commissions",
      "Press, galleries & wholesale",
    ]);
  });

  it("can start on another topic", () => {
    render(<ContactForm defaultTopic="commission" />);
    expect(topic()).toHaveValue("commission");
  });

  it("sends the message and shows the thank-you", async () => {
    vi.mocked(submitContact).mockResolvedValue({ status: "success", message: "Thank you! Your message is on its way." });
    render(<ContactForm />);
    await userEvent.type(screen.getByRole("textbox", { name: "Your name" }), "Ana");
    await userEvent.type(screen.getByRole("textbox", { name: "Email" }), "ana@example.com");
    await userEvent.selectOptions(topic(), "An existing order");
    await userEvent.type(screen.getByRole("textbox", { name: "Message" }), "Where is my print?");
    await submit();

    expect(Object.fromEntries(vi.mocked(submitContact).mock.calls[0][1] as FormData)).toEqual({
      website: "",
      name: "Ana",
      email: "ana@example.com",
      topic: "order",
      message: "Where is my print?",
    });
    expect(screen.getByRole("status")).toHaveTextContent("Thank you! Your message is on its way.");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("highlights field errors and keeps what was typed", async () => {
    vi.mocked(submitContact).mockResolvedValue({
      status: "error",
      message: "Please check the highlighted fields.",
      errors: { message: "Please add a few more details." },
      values: { name: "Ana", email: "ana@example.com", topic: "press", message: "Hi" },
    });
    render(<ContactForm />);
    await submit();

    expect(screen.getByRole("alert")).toHaveTextContent("Please check the highlighted fields.");
    const message = screen.getByRole("textbox", { name: "Message" });
    expect(message).toHaveAttribute("aria-invalid", "true");
    expect(message).toHaveAccessibleDescription("Please add a few more details.");
    expect(message).toHaveValue("Hi");
    expect(topic()).toHaveValue("press");
    expect(message).toHaveValue("Hi");
    expect(screen.getByRole("textbox", { name: "Your name" })).toHaveValue("Ana");
  });

  it("disables the button while sending", async () => {
    let resolve!: (s: FormState) => void;
    vi.mocked(submitContact).mockReturnValue(new Promise((r) => (resolve = r)));
    render(<ContactForm />);
    await submit();
    expect(screen.getByRole("button", { name: "Sending…" })).toBeDisabled();
    await act(async () => resolve({ status: "success", message: "Sent" }));
    expect(screen.getByRole("status")).toHaveTextContent("Sent");
  });
});
