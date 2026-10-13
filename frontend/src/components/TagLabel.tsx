import type { Tag } from "../types";
import "./TagLabel.css";

interface TagLabelProps {
  tag: Tag;
}

/** A tag rendered as its axis shape + plain text name, reusing the Mark's shape language. */
export function TagLabel({ tag }: TagLabelProps) {
  return (
    <span className="tag-label">
      <span className={`tag-shape tag-shape--${tag.type.toLowerCase()}`} aria-hidden="true" />
      {tag.name}
    </span>
  );
}
