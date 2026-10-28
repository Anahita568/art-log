import { gql } from "@apollo/client";

export const ARTWORKS_QUERY = gql`
  query Artworks($filter: ArtworkFilterInput, $sort: ArtworkSort, $page: Int, $pageSize: Int) {
    artworks(filter: $filter, sort: $sort, page: $page, pageSize: $pageSize) {
      items {
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
      totalCount
      hasMore
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

export const IS_ADMIN_QUERY = gql`
  query IsAdmin {
    isAdmin
  }
`;
