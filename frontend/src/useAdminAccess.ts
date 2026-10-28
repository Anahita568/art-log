import { useQuery } from "@apollo/client/react";
import { clearAdminToken, setAdminToken } from "./adminToken";
import { IS_ADMIN_QUERY } from "./graphql/queries";

/**
 * Whether this browser may edit, as confirmed by the server, plus unlock/lock actions. The server is the
 * source of truth: a stored token only counts once `isAdmin` comes back true.
 */
export function useAdminAccess() {
  const { data, refetch } = useQuery<{ isAdmin: boolean }>(IS_ADMIN_QUERY, { fetchPolicy: "network-only" });
  const isAdmin = data?.isAdmin ?? false;

  /** Resolves to whether the server accepted the token; a rejected token isn't kept. */
  async function unlock(token: string): Promise<boolean> {
    setAdminToken(token);
    const { data: checked } = await refetch();
    if (!checked?.isAdmin) {
      clearAdminToken();
      return false;
    }
    return true;
  }

  async function lock() {
    clearAdminToken();
    await refetch();
  }

  return { isAdmin, unlock, lock };
}
