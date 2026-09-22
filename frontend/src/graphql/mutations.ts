import { gql } from "@apollo/client";

export const ADD_ARTWORK_MUTATION = gql`
  mutation AddArtwork($input: AddArtworkInput!) {
    addArtwork(input: $input) {
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
