/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Chip } from "./Chip";

describe("Chip", () => {
  it("shows whether it is pressed and reports clicks", async () => {
    const onClick = vi.fn();
    const { rerender } = render(<Chip active={false} onClick={onClick}>Prints</Chip>);
    const chip = screen.getByRole("button", { name: "Prints" });
    expect(chip).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(chip);
    expect(onClick).toHaveBeenCalledOnce();
    rerender(<Chip active onClick={onClick}>Prints</Chip>);
    expect(chip).toHaveAttribute("aria-pressed", "true");
  });
});
