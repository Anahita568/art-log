import { useState, type FormEvent } from "react";
import { useMutation } from "@apollo/client/react";
import { ADD_ARTWORK_MUTATION } from "../graphql/mutations";
import { TAG_AXES } from "../tagAxes";
import type { AddArtworkInput, TagInput, TagType } from "../types";
import "./AddArtworkForm.css";

type AxisText = Record<TagType, string>;

const EMPTY_AXIS_TEXT: AxisText = {
  MEDIUM: "",
  MOVEMENT: "",
  MOOD: "",
  COLOR: "",
  SUBJECT: "",
};

const EMPTY_DETAILS = { title: "", artist: "", year: "", imageUrl: "", notes: "" };

export function AddArtworkForm() {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState(EMPTY_DETAILS);
  const [axisText, setAxisText] = useState<AxisText>(EMPTY_AXIS_TEXT);

  const [addArtwork, { loading, error }] = useMutation(ADD_ARTWORK_MUTATION, {
    refetchQueries: ["Artworks", "Tags"],
  });

  function reset() {
    setDetails(EMPTY_DETAILS);
    setAxisText(EMPTY_AXIS_TEXT);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const input: AddArtworkInput = {
      title: details.title,
      artist: details.artist || null,
      year: details.year ? Number(details.year) : null,
      imageUrl: details.imageUrl || null,
      notes: details.notes || null,
      tags: parseTags(axisText),
    };

    await addArtwork({ variables: { input } });
    reset();
    setOpen(false);
  }

  if (!open) {
    return (
      <button type="button" className="add-artwork-toggle" onClick={() => setOpen(true)}>
        + Log a new piece
      </button>
    );
  }

  return (
    <form className="add-artwork-form" onSubmit={handleSubmit}>
      <h2>New catalog entry</h2>

      <label>
        Title
        <input
          value={details.title}
          onChange={(e) => setDetails({ ...details, title: e.target.value })}
          required
        />
      </label>
      <label>
        Artist
        <input value={details.artist} onChange={(e) => setDetails({ ...details, artist: e.target.value })} />
      </label>
      <label>
        Year
        <input
          type="number"
          value={details.year}
          onChange={(e) => setDetails({ ...details, year: e.target.value })}
        />
      </label>
      <label>
        Image URL
        <input value={details.imageUrl} onChange={(e) => setDetails({ ...details, imageUrl: e.target.value })} />
      </label>
      <label>
        Notes
        <textarea value={details.notes} onChange={(e) => setDetails({ ...details, notes: e.target.value })} />
      </label>

      {TAG_AXES.map(({ type, label }) => (
        <label key={type}>
          {label} <span className="hint">comma-separated, new tags welcome</span>
          <input
            value={axisText[type]}
            onChange={(e) => setAxisText({ ...axisText, [type]: e.target.value })}
          />
        </label>
      ))}

      {error && <p className="form-error">{error.message}</p>}

      <div className="form-actions">
        <button type="button" onClick={() => setOpen(false)}>
          Cancel
        </button>
        <button type="submit" disabled={loading}>
          {loading ? "Saving…" : "Save to catalog"}
        </button>
      </div>
    </form>
  );
}

function parseTags(axisText: AxisText): TagInput[] {
  return TAG_AXES.flatMap(({ type }) =>
    axisText[type]
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name) => ({ name, type })),
  );
}
