import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { ADD_ARTWORK_MUTATION } from "../graphql/mutations";
import { ArtworkForm } from "./ArtworkForm";
import type { AddArtworkInput } from "../types";
import "./AddArtworkForm.css";

export function AddArtworkForm() {
  const [open, setOpen] = useState(false);

  const [addArtwork, { loading, error }] = useMutation(ADD_ARTWORK_MUTATION, {
    refetchQueries: ["Artworks", "Tags"],
  });

  if (!open) {
    return (
      <button type="button" className="add-artwork-toggle" onClick={() => setOpen(true)}>
        + Log a new piece
      </button>
    );
  }

  async function handleSubmit(input: AddArtworkInput) {
    await addArtwork({ variables: { input } });
    setOpen(false);
  }

  return (
    <ArtworkForm
      heading="New catalog entry"
      submitLabel="Save to catalog"
      pendingLabel="Saving…"
      submitting={loading}
      error={error}
      onSubmit={handleSubmit}
      onCancel={() => setOpen(false)}
    />
  );
}
