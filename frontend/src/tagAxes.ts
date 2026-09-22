import type { TagAxisKey, TagType } from "./types";

export const TAG_AXES: ReadonlyArray<{ type: TagType; label: string; filterKey: TagAxisKey }> = [
  { type: "MEDIUM", label: "Medium", filterKey: "mediums" },
  { type: "MOVEMENT", label: "Movement", filterKey: "movements" },
  { type: "MOOD", label: "Mood", filterKey: "moods" },
  { type: "COLOR", label: "Color", filterKey: "colors" },
  { type: "SUBJECT", label: "Subject", filterKey: "subjects" },
];
