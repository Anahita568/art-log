import { useQuery } from "@apollo/client/react";
import { ARTWORKS_QUERY } from "../graphql/queries";
import type { Artwork, ArtworkFilterInput } from "../types";
import { ArtworkCard } from "./ArtworkCard";
import "./ArtworkGrid.css";

interface ArtworkGridProps {
  filter: ArtworkFilterInput;
}

export function ArtworkGrid({ filter }: ArtworkGridProps) {
  const { data, loading, error } = useQuery<{ artworks: Artwork[] }>(ARTWORKS_QUERY, {
    variables: { filter },
  });

  if (loading && !data) {
    return <p className="grid-status">Loading the collection…</p>;
  }

  if (error) {
    return <p className="grid-status grid-status--error">Couldn't reach the catalog: {error.message}</p>;
  }

  const artworks = data?.artworks ?? [];

  if (artworks.length === 0) {
    return <p className="grid-status">No pieces match these filters yet.</p>;
  }

  return (
    <div className="artwork-grid">
      {artworks.map((artwork) => (
        <ArtworkCard key={artwork.id} artwork={artwork} />
      ))}
    </div>
  );
}
