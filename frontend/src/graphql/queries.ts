import { gql } from "@apollo/client";

export const ARTWORKS_QUERY = gql`
  query Artworks($filter: ArtworkFilterInput) {
    artworks(filter: $filter) {
      id
      title
      artist
      year
      imageUrl
      notes
      tags {
        id
        name
        type
      }
    }
  }
`;

export const TAGS_QUERY = gql`
  query Tags {
    tags {
      id
      name
      type
      usageCount
    }
  }
`;
