import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from "@apollo/client";
import { SetContextLink } from "@apollo/client/link/context";
import { adminHeaders } from "../adminToken";

const GRAPHQL_URI = import.meta.env.VITE_GRAPHQL_URI ?? "http://localhost:8080/graphql";

// Read the token per request, so unlocking or locking takes effect without rebuilding the client.
const adminTokenLink = new SetContextLink((prevContext) => ({
  headers: { ...prevContext.headers, ...adminHeaders() },
}));

export const apolloClient = new ApolloClient({
  link: ApolloLink.from([adminTokenLink, new HttpLink({ uri: GRAPHQL_URI })]),
  cache: new InMemoryCache(),
});
