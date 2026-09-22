import type { Artwork } from "../types";
import "./ArtworkCard.css";

interface ArtworkCardProps {
  artwork: Artwork;
}

export function ArtworkCard({ artwork }: ArtworkCardProps) {
  const byline = [artwork.artist, artwork.year?.toString()].filter(Boolean).join(", ");

  return (
    <article className="artwork-card">
      <div className="artwork-card__image-frame">
        {artwork.imageUrl ? (
          <img src={artwork.imageUrl} alt={artwork.title} loading="lazy" />
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
        {artwork.notes && <p className="artwork-card__notes">{artwork.notes}</p>}
      </div>
    </article>
  );
}
