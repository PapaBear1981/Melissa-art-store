/** @vitest-environment jsdom */
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { submitCommission } from "@/lib/forms/actions";
import type { FormState } from "@/lib/forms/types";
import { CommissionForm } from "./CommissionForm";

vi.mock("@/lib/forms/actions", () => ({ submitCommission: vi.fn() }));

const submit = () => userEvent.click(screen.getByRole("button", { name: "Send commission request" }));
const box = (name: string | RegExp) => screen.getByRole("textbox", { name });
const select = (name: string) => screen.getByRole("combobox", { name });

describe("CommissionForm", () => {
  it("starts with nothing chosen", () => {
    render(<CommissionForm />);
    expect(select("Size")).toHaveValue("");
    expect(select("Budget")).toHaveValue("");
    expect(screen.getByRole("option", { name: "Choose a size…" })).toBeDisabled();
    expect(box(/^What would you like painted\?/)).toHaveAccessibleDescription(
      "A place, a person, a pet, a feeling. Tell the story behind it.",
    );
    expect(screen.getByLabelText(/^Reference photos/)).toHaveAccessibleDescription(
      "Up to 5 images (JPG, PNG, WEBP or HEIC), 5 MB each.",
    );
  });

  it("sends the request with reference photos and shows the confirmation", async () => {
    vi.mocked(submitCommission).mockResolvedValue({ status: "success", message: "Your commission request has been sent!" });
    render(<CommissionForm />);

    await userEvent.type(box("Your name"), "Ana");
    await userEvent.type(box("Email"), "ana@example.com");
    await userEvent.selectOptions(select("Size"), "24″ × 30″");
    await userEvent.type(box(/^What would you like painted\?/), "Our garden in spring");
    await userEvent.type(box(/^Colors or mood/), "Soft pinks");
    await userEvent.selectOptions(select("Budget"), "$1,500 – $3,000");
    await userEvent.type(box(/^Needed by/), "May");
    await userEvent.type(box("Shipping to (city, country)"), "Austin, USA");
    const photo = new File(["img"], "garden.jpg", { type: "image/jpeg" });
    const photos = screen.getByLabelText(/^Reference photos/) as HTMLInputElement;
    await userEvent.upload(photos, photo);
    await userEvent.type(box(/^Anything else\?/), "Thanks!");
    await submit();

    const data = vi.mocked(submitCommission).mock.calls[0][1] as FormData;
    expect(Object.fromEntries([...data].filter(([, v]) => typeof v === "string"))).toEqual({
      website: "",
      name: "Ana",
      email: "ana@example.com",
      size: "24″ × 30″",
      customSize: "",
      subject: "Our garden in spring",
      colors: "Soft pinks",
      budget: "$1,500 – $3,000",
      deadline: "May",
      shipTo: "Austin, USA",
      notes: "Thanks!",
    });
    // jsdom's FormData can't see files set by user-event, so check the input itself.
    expect(photos.files?.[0]).toBe(photo);
    expect(data.has("photos")).toBe(true);

    expect(screen.getByRole("status")).toHaveTextContent("Your commission request has been sent!");
    expect(screen.queryByRole("button", { name: "Send commission request" })).not.toBeInTheDocument();
  });

  it("highlights field errors and keeps what was entered", async () => {
    vi.mocked(submitCommission).mockResolvedValue({
      status: "error",
      message: "Please check the highlighted fields.",
      errors: { budget: "Please choose a budget range.", photos: "notes.pdf isn't a supported image (JPG, PNG, WEBP or HEIC)." },
      values: { name: "Ana", email: "ana@example.com", size: "Custom size", customSize: "20″ × 60″", subject: "The sea" },
    });
    render(<CommissionForm />);
    await submit();

    expect(screen.getByRole("alert")).toHaveTextContent("Please check the highlighted fields.");
    expect(select("Budget")).toHaveAttribute("aria-invalid", "true");
    expect(select("Budget")).toHaveAccessibleDescription("Please choose a budget range.");
    expect(select("Budget")).toHaveValue("");
    const photos = screen.getByLabelText(/^Reference photos/);
    expect(photos).toHaveAttribute("aria-invalid", "true");
    expect(photos).toHaveAccessibleDescription(
      "Up to 5 images (JPG, PNG, WEBP or HEIC), 5 MB each. notes.pdf isn't a supported image (JPG, PNG, WEBP or HEIC).",
    );

    expect(select("Size")).toHaveAttribute("aria-invalid", "false");
    expect(select("Size")).toHaveValue("Custom size");
    expect(box(/^Custom size/)).toHaveValue("20″ × 60″");
    expect(box("Your name")).toHaveValue("Ana");
    expect(box(/^What would you like painted\?/)).toHaveValue("The sea");
  });

  it("disables the button while sending", async () => {
    let resolve!: (s: FormState) => void;
    vi.mocked(submitCommission).mockReturnValue(new Promise((r) => (resolve = r)));
    render(<CommissionForm />);
    await submit();
    expect(screen.getByRole("button", { name: "Sending…" })).toBeDisabled();
    await act(async () => resolve({ status: "success", message: "Sent" }));
    expect(screen.getByRole("status")).toHaveTextContent("Sent");
  });
});
