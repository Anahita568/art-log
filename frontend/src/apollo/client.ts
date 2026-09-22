import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

const GRAPHQL_URI = import.meta.env.VITE_GRAPHQL_URI ?? "http://localhost:8080/graphql";

export const apolloClient = new ApolloClient({
  link: new HttpLink({ uri: GRAPHQL_URI }),
  cache: new InMemoryCache(),
});
