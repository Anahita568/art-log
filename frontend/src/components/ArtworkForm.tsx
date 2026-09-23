import { useState, type ChangeEvent, type FormEvent } from "react";
import { TAG_AXES } from "../tagAxes";
import type { AddArtworkInput, Artwork, TagInput, TagType } from "../types";
import { uploadImage } from "../uploadImage";
import "./ArtworkForm.css";

type AxisText = Record<TagType, string>;

const EMPTY_AXIS_TEXT: AxisText = {
  MEDIUM: "",
  MOVEMENT: "",
  MOOD: "",
  COLOR: "",
  SUBJECT: "",
};

interface Details {
  title: string;
  artist: string;
  year: string;
  imageUrl: string;
  notes: string;
}

const EMPTY_DETAILS: Details = { title: "", artist: "", year: "", imageUrl: "", notes: "" };

function detailsFromArtwork(artwork: Artwork | undefined): Details {
  if (!artwork) return EMPTY_DETAILS;
  return {
    title: artwork.title,
    artist: artwork.artist ?? "",
    year: artwork.year?.toString() ?? "",
    imageUrl: artwork.imageUrl ?? "",
    notes: artwork.notes ?? "",
  };
}

function axisTextFromArtwork(artwork: Artwork | undefined): AxisText {
  const axisText = { ...EMPTY_AXIS_TEXT };
  for (const tag of artwork?.tags ?? []) {
    axisText[tag.type] = axisText[tag.type] ? `${axisText[tag.type]}, ${tag.name}` : tag.name;
  }
  return axisText;
}

interface ArtworkFormProps {
  heading: string;
  submitLabel: string;
  pendingLabel: string;
  initialArtwork?: Artwork;
  showNotes?: boolean;
  submitting: boolean;
  error?: Error;
  onSubmit: (input: AddArtworkInput) => void;
  onCancel: () => void;
}

export function ArtworkForm({
  heading,
  submitLabel,
  pendingLabel,
  initialArtwork,
  showNotes = true,
  submitting,
  error,
  onSubmit,
  onCancel,
}: ArtworkFormProps) {
  const [details, setDetails] = useState<Details>(() => detailsFromArtwork(initialArtwork));
  const [axisText, setAxisText] = useState<AxisText>(() => axisTextFromArtwork(initialArtwork));
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imageBroken, setImageBroken] = useState(false);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    try {
      const imageUrl = await uploadImage(file);
      setDetails((current) => ({ ...current, imageUrl }));
      setImageBroken(false);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit({
      title: details.title,
      artist: details.artist || null,
      year: details.year ? Number(details.year) : null,
      imageUrl: details.imageUrl || null,
      notes: details.notes || null,
      tags: parseTags(axisText),
    });
  }

  return (
    <form className="artwork-form" onSubmit={handleSubmit}>
      <h2>{heading}</h2>

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
        <input
          value={details.imageUrl}
          onChange={(e) => {
            setDetails({ ...details, imageUrl: e.target.value });
            setImageBroken(false);
          }}
          placeholder="Paste a link, or upload a file below"
        />
      </label>
      <label>
        Upload an image
        <input type="file" accept="image/*" onChange={handleFileChange} disabled={isUploading} />
      </label>
      {isUploading && <p className="hint">Uploading…</p>}
      {uploadError && <p className="form-error">{uploadError}</p>}
      {details.imageUrl && !imageBroken && (
        <img
          className="artwork-form__preview"
          src={details.imageUrl}
          alt="Preview"
          onError={() => setImageBroken(true)}
        />
      )}
      {details.imageUrl && imageBroken && <p className="form-error">Couldn't load that image.</p>}
      {showNotes && (
        <label>
          Notes
          <textarea value={details.notes} onChange={(e) => setDetails({ ...details, notes: e.target.value })} />
        </label>
      )}

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
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" disabled={submitting}>
          {submitting ? pendingLabel : submitLabel}
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
