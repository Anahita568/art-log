import { useEffect, useState } from "react";
import { useMutation } from "@apollo/client/react";
import {
  DELETE_ARTWORK_MUTATION,
  UPDATE_ARTWORK_MUTATION,
  UPDATE_ARTWORK_NOTES_MUTATION,
} from "../graphql/mutations";
import type { AddArtworkInput, Artwork } from "../types";
import { ArtworkForm } from "./ArtworkForm";
import "./ArtworkDetail.css";

interface ArtworkDetailProps {
  artwork: Artwork;
  onClose: () => void;
}

export function ArtworkDetail({ artwork, onClose }: ArtworkDetailProps) {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [draftNotes, setDraftNotes] = useState(artwork.notes ?? "");
  const [isEditingDetails, setIsEditingDetails] = useState(false);

  const [updateNotes, { loading: savingNotes }] = useMutation(UPDATE_ARTWORK_NOTES_MUTATION);
  const [updateArtwork, { loading: savingDetails, error: detailsError }] = useMutation(UPDATE_ARTWORK_MUTATION, {
    refetchQueries: ["Artworks", "Tags"],
  });
  const [deleteArtwork, { loading: deleting }] = useMutation(DELETE_ARTWORK_MUTATION, {
    refetchQueries: ["Artworks"],
  });

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const byline = [artwork.artist, artwork.year?.toString()].filter(Boolean).join(", ");

  function startEditingNotes() {
    setDraftNotes(artwork.notes ?? "");
    setIsEditingNotes(true);
  }

  async function saveNotes() {
    await updateNotes({ variables: { id: artwork.id, notes: draftNotes || null } });
    setIsEditingNotes(false);
  }

  async function handleDelete() {
    if (window.confirm(`Remove "${artwork.title}" from the catalog?`)) {
      await deleteArtwork({ variables: { id: artwork.id } });
      onClose();
    }
  }

  async function saveDetails(input: AddArtworkInput) {
    const { title, artist, year, imageUrl, tags } = input;
    await updateArtwork({ variables: { id: artwork.id, input: { title, artist, year, imageUrl, tags } } });
    setIsEditingDetails(false);
  }

  return (
    <div className="artwork-detail-overlay" onClick={onClose}>
      <div className="artwork-detail" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="artwork-detail__close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="artwork-detail__image-frame">
          {artwork.imageUrl ? (
            <img src={artwork.imageUrl} alt={artwork.title} />
          ) : (
            <div className="artwork-card__placeholder">no image on file</div>
          )}
        </div>

        <div className="artwork-detail__body">
          {isEditingDetails ? (
            <ArtworkForm
              heading="Edit details"
              submitLabel="Save changes"
              pendingLabel="Saving…"
              initialArtwork={artwork}
              showNotes={false}
              submitting={savingDetails}
              error={detailsError}
              onSubmit={saveDetails}
              onCancel={() => setIsEditingDetails(false)}
            />
          ) : (
            <>
              <div className="artwork-detail__title-row">
                <h2 className="artwork-detail__title">{artwork.title}</h2>
                <button type="button" className="card-action" onClick={() => setIsEditingDetails(true)}>
                  Edit details
                </button>
              </div>
              {byline && <p className="artwork-detail__byline">{byline}</p>}

              {artwork.tags.length > 0 && (
                <ul className="artwork-card__tags">
                  {artwork.tags.map((tag) => (
                    <li key={tag.id} className={`tag-chip tag-chip--${tag.type.toLowerCase()}`}>
                      {tag.name}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          <div className="artwork-detail__notes-section">
            <div className="artwork-detail__notes-header">
              <span className="artwork-detail__notes-label">Notes</span>
              {!isEditingNotes && (
                <button type="button" className="card-action" onClick={startEditingNotes}>
                  Edit
                </button>
              )}
            </div>

            {isEditingNotes ? (
              <div className="artwork-card__notes-edit">
                <textarea
                  value={draftNotes}
                  onChange={(event) => setDraftNotes(event.target.value)}
                  placeholder="Notes…"
                  autoFocus
                />
                <div className="artwork-card__notes-actions">
                  <button type="button" onClick={() => setIsEditingNotes(false)}>
                    Cancel
                  </button>
                  <button type="button" onClick={saveNotes} disabled={savingNotes}>
                    {savingNotes ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              <p className="artwork-detail__notes">{artwork.notes || "No notes yet."}</p>
            )}
          </div>

          <button type="button" className="card-action card-action--delete" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Removing…" : "Delete this piece"}
          </button>
        </div>
      </div>
    </div>
  );
}
