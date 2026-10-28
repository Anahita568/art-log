import { useQuery } from "@apollo/client/react";
import { TAGS_QUERY } from "../graphql/queries";
import { groupTagsByType, TAG_AXES } from "../tagAxes";
import type { ArtworkFilterInput, Tag, TagAxisKey } from "../types";
import "./FilterPanel.css";

interface FilterPanelProps {
  filter: ArtworkFilterInput;
  onChange: (filter: ArtworkFilterInput) => void;
  /** Omitted for visitors, who can't edit tags. */
  onManageTags?: () => void;
}

export function FilterPanel({ filter, onChange, onManageTags }: FilterPanelProps) {
  const { data } = useQuery<{ tags: Tag[] }>(TAGS_QUERY);
  const tagsByType = groupTagsByType(data?.tags ?? []);

  function toggleTag(axisKey: TagAxisKey, name: string) {
    const current = filter[axisKey] ?? [];
    const next = current.includes(name) ? current.filter((n) => n !== name) : [...current, name];
    onChange({ ...filter, [axisKey]: next.length > 0 ? next : undefined });
  }

  return (
    <section className="filter-panel">
      <input
        type="search"
        className="filter-search"
        placeholder="Search by title or artist…"
        value={filter.search ?? ""}
        onChange={(event) => onChange({ ...filter, search: event.target.value || undefined })}
      />

      <div className="filter-axes">
        {TAG_AXES.map(({ type, label, filterKey }) => {
          const tags = tagsByType[type] ?? [];
          if (tags.length === 0) return null;
          return (
            <div key={type} className="filter-axis">
              <span className={`filter-axis__label filter-axis__label--${type.toLowerCase()}`}>{label}</span>
              {tags.map((tag) => {
                const active = (filter[filterKey] ?? []).includes(tag.name);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    className={active ? "filter-tag filter-tag--active" : "filter-tag"}
                    onClick={() => toggleTag(filterKey, tag.name)}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {onManageTags && (
        <button type="button" className="filter-panel__manage-tags" onClick={onManageTags}>
          Manage tags
        </button>
      )}
    </section>
  );
}
