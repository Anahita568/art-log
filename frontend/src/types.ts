export type TagType = "MEDIUM" | "MOVEMENT" | "MOOD" | "COLOR" | "SUBJECT";

export interface Tag {
  id: string;
  name: string;
  type: TagType;
  usageCount: number;
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

export type ArtworkSort = "CREATED_DATE_DESC" | "CREATED_DATE_ASC" | "YEAR_DESC" | "YEAR_ASC" | "TITLE_ASC";

export interface ArtworkPage {
  items: Artwork[];
  totalCount: number;
  hasMore: boolean;
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

export interface UpdateArtworkInput {
  title: string;
  artist: string | null;
  year: number | null;
  imageUrl: string | null;
  tags: TagInput[];
}
