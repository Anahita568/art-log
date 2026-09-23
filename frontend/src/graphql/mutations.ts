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

export const UPDATE_ARTWORK_NOTES_MUTATION = gql`
  mutation UpdateArtworkNotes($id: ID!, $notes: String) {
    updateArtworkNotes(id: $id, notes: $notes) {
      id
      notes
    }
  }
`;

export const DELETE_ARTWORK_MUTATION = gql`
  mutation DeleteArtwork($id: ID!) {
    deleteArtwork(id: $id)
  }
`;
