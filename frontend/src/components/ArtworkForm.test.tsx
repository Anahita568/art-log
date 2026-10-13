import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ArtworkForm } from "./ArtworkForm";
import type { Artwork } from "../types";

/**
 * Covers the comma-separated tag parsing in ArtworkForm (parseTags/axisTextFromArtwork): trimming
 * whitespace, dropping empty entries, and routing each value to the right axis. Tested through the
 * rendered form rather than exporting the private function, since what actually matters is the
 * input-to-submitted-payload behavior a user triggers.
 */
describe("ArtworkForm", () => {
  it("parses comma-separated tags per axis, trimming whitespace and dropping empties", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <ArtworkForm
        heading="New entry"
        submitLabel="Save"
        pendingLabel="Saving…"
        submitting={false}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText(/^Title/), "Starry Night");
    await user.type(screen.getByLabelText(/^Medium/), "Oil paint,  Charcoal ,");
    await user.type(screen.getByLabelText(/^Mood/), " Nostalgic ");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: "Starry Night",
      artist: null,
      year: null,
      imageUrl: null,
      notes: null,
      tags: [
        { name: "Oil paint", type: "MEDIUM" },
        { name: "Charcoal", type: "MEDIUM" },
        { name: "Nostalgic", type: "MOOD" },
      ],
    });
  });

  it("pre-fills axis fields from an existing artwork's tags and round-trips them on submit", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const artwork: Artwork = {
      id: "1",
      title: "Sunflowers",
      artist: "Vincent van Gogh",
      year: 1888,
      imageUrl: null,
      notes: null,
      tags: [
        { id: "1", name: "Oil paint", type: "MEDIUM", usageCount: 1 },
        { id: "2", name: "Joyful", type: "MOOD", usageCount: 1 },
      ],
    };

    render(
      <ArtworkForm
        heading="Edit details"
        submitLabel="Save changes"
        pendingLabel="Saving…"
        initialArtwork={artwork}
        showNotes={false}
        submitting={false}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByLabelText(/^Medium/)).toHaveValue("Oil paint");
    expect(screen.getByLabelText(/^Mood/)).toHaveValue("Joyful");

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Sunflowers",
        tags: [
          { name: "Oil paint", type: "MEDIUM" },
          { name: "Joyful", type: "MOOD" },
        ],
      }),
    );
  });
});
