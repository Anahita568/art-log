import { useEffect, useState } from "react";
import { useQuery } from "@apollo/client/react";
import { ARTWORKS_QUERY } from "../graphql/queries";
import type { Artwork, ArtworkFilterInput, ArtworkPage, ArtworkSort } from "../types";
import { ArtworkCard } from "./ArtworkCard";
import { ArtworkDetail } from "./ArtworkDetail";
import "./ArtworkGrid.css";

const PAGE_SIZE = 24;

interface ArtworkGridProps {
  filter: ArtworkFilterInput;
  sort: ArtworkSort;
}

export function ArtworkGrid({ filter, sort }: ArtworkGridProps) {
  const { data, loading, error, fetchMore } = useQuery<{ artworks: ArtworkPage }>(ARTWORKS_QUERY, {
    variables: { filter, sort, page: 0, pageSize: PAGE_SIZE },
  });
  const [extraItems, setExtraItems] = useState<Artwork[]>([]);
  const [nextPage, setNextPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [openArtworkId, setOpenArtworkId] = useState<string | null>(null);

  useEffect(() => {
    if (data) setHasMore(data.artworks.hasMore);
  }, [data]);

  if (loading && !data) {
    return <p className="grid-status">Loading the collection…</p>;
  }

  if (error) {
    return <p className="grid-status grid-status--error">Couldn't reach the catalog: {error.message}</p>;
  }

  const items = [...(data?.artworks.items ?? []), ...extraItems];
  const totalCount = data?.artworks.totalCount ?? 0;
  const openArtwork = items.find((artwork) => artwork.id === openArtworkId) ?? null;

  async function loadMore() {
    setLoadingMore(true);
    const { data: more } = await fetchMore({ variables: { page: nextPage } });
    setExtraItems((prev) => [...prev, ...more.artworks.items]);
    setHasMore(more.artworks.hasMore);
    setNextPage((page) => page + 1);
    setLoadingMore(false);
  }

  if (items.length === 0) {
    return <p className="grid-status">No pieces match these filters yet.</p>;
  }

  return (
    <>
      <div className="artwork-grid">
        {items.map((artwork) => (
          <ArtworkCard key={artwork.id} artwork={artwork} onOpen={() => setOpenArtworkId(artwork.id)} />
        ))}
      </div>

      {hasMore && (
        <button type="button" className="artwork-grid__load-more" onClick={loadMore} disabled={loadingMore}>
          {loadingMore ? "Loading…" : `Load more (${items.length} of ${totalCount})`}
        </button>
      )}

      {openArtwork && <ArtworkDetail artwork={openArtwork} onClose={() => setOpenArtworkId(null)} />}
    </>
  );
}
