import { useEffect, useState } from "react";
import type { Artwork } from "../types";
import "./ArtworkCard.css";

interface ArtworkCardProps {
  artwork: Artwork;
  onOpen: () => void;
}

export function ArtworkCard({ artwork, onOpen }: ArtworkCardProps) {
  const [imageBroken, setImageBroken] = useState(false);
  useEffect(() => setImageBroken(false), [artwork.imageUrl]);

  const byline = [artwork.artist, artwork.year?.toString()].filter(Boolean).join(", ");

  return (
    <article
      className="artwork-card"
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      <div className="artwork-card__image-frame">
        {artwork.imageUrl && !imageBroken ? (
          <img
            src={artwork.imageUrl}
            alt={artwork.title}
            loading="lazy"
            onError={() => setImageBroken(true)}
          />
        ) : (
          <div className="artwork-card__placeholder">no image on file</div>
        )}
      </div>
      <div className="artwork-card__body">
        <h3 className="artwork-card__title">{artwork.title}</h3>
        {byline && <p className="artwork-card__byline">{byline}</p>}
        {artwork.tags.length > 0 && (
          <ul className="artwork-card__tags">
            {artwork.tags.map((tag) => (
              <li key={tag.id} className={`tag-chip tag-chip--${tag.type.toLowerCase()}`}>
                {tag.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
