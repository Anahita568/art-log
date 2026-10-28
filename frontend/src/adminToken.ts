// The owner's admin token, kept in this browser only. Visitors never have one, so they browse read-only.
const STORAGE_KEY = "artlog.adminToken";

export const ADMIN_TOKEN_HEADER = "X-Admin-Token";

export function getAdminToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(token: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, token);
  } catch {
    // Storage unavailable (e.g. private mode): editing just won't survive a reload.
  }
}

export function clearAdminToken(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing stored to clear.
  }
}

/** Headers to attach to any write request; empty for visitors. */
export function adminHeaders(): Record<string, string> {
  const token = getAdminToken();
  return token ? { [ADMIN_TOKEN_HEADER]: token } : {};
}
