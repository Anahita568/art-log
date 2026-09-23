import type { Tag, TagAxisKey, TagType } from "./types";

export const TAG_AXES: ReadonlyArray<{ type: TagType; label: string; filterKey: TagAxisKey }> = [
  { type: "MEDIUM", label: "Medium", filterKey: "mediums" },
  { type: "MOVEMENT", label: "Movement", filterKey: "movements" },
  { type: "MOOD", label: "Mood", filterKey: "moods" },
  { type: "COLOR", label: "Color", filterKey: "colors" },
  { type: "SUBJECT", label: "Subject", filterKey: "subjects" },
];

export function groupTagsByType(tags: Tag[]): Partial<Record<TagType, Tag[]>> {
  const grouped: Partial<Record<TagType, Tag[]>> = {};
  for (const tag of tags) {
    (grouped[tag.type] ??= []).push(tag);
  }
  return grouped;
}
