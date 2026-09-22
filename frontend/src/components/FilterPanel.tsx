import { useQuery } from "@apollo/client/react";
import { TAGS_QUERY } from "../graphql/queries";
import { TAG_AXES } from "../tagAxes";
import type { ArtworkFilterInput, Tag, TagAxisKey, TagType } from "../types";
import "./FilterPanel.css";

interface FilterPanelProps {
  filter: ArtworkFilterInput;
  onChange: (filter: ArtworkFilterInput) => void;
}

export function FilterPanel({ filter, onChange }: FilterPanelProps) {
  const { data } = useQuery<{ tags: Tag[] }>(TAGS_QUERY);
  const tagsByType = groupByType(data?.tags ?? []);

  function toggleTag(axisKey: TagAxisKey, name: string) {
    const current = filter[axisKey] ?? [];
    const next = current.includes(name) ? current.filter((n) => n !== name) : [...current, name];
    onChange({ ...filter, [axisKey]: next.length > 0 ? next : undefined });
  }

  return (
    <aside className="filter-panel">
      <div className="filter-panel__label">Search the collection</div>
      <input
        type="search"
        className="filter-search"
        placeholder="Title or artist…"
        value={filter.search ?? ""}
        onChange={(event) => onChange({ ...filter, search: event.target.value || undefined })}
      />

      {TAG_AXES.map(({ type, label, filterKey }) => (
        <fieldset key={type} className="filter-axis">
          <legend>{label}</legend>
          {(tagsByType[type] ?? []).map((tag) => (
            <label key={tag.id} className="filter-checkbox">
              <input
                type="checkbox"
                checked={(filter[filterKey] ?? []).includes(tag.name)}
                onChange={() => toggleTag(filterKey, tag.name)}
              />
              <span>{tag.name}</span>
            </label>
          ))}
        </fieldset>
      ))}
    </aside>
  );
}

function groupByType(tags: Tag[]): Partial<Record<TagType, Tag[]>> {
  const grouped: Partial<Record<TagType, Tag[]>> = {};
  for (const tag of tags) {
    (grouped[tag.type] ??= []).push(tag);
  }
  return grouped;
}
