export type TagType = "MEDIUM" | "MOVEMENT" | "MOOD" | "COLOR" | "SUBJECT";

export interface Tag {
  id: string;
  name: string;
  type: TagType;
}

export interface Artwork {
  id: string;
  title: string;
  artist: string | null;
  year: number | null;
  imageUrl: string | null;
  notes: string | null;
  tags: Tag[];
}

export type TagAxisKey = "mediums" | "movements" | "moods" | "colors" | "subjects";

export interface ArtworkFilterInput {
  mediums?: string[];
  movements?: string[];
  moods?: string[];
  colors?: string[];
  subjects?: string[];
  search?: string;
}

export interface TagInput {
  name: string;
  type: TagType;
}

export interface AddArtworkInput {
  title: string;
  artist: string | null;
  year: number | null;
  imageUrl: string | null;
  notes: string | null;
  tags: TagInput[];
}
