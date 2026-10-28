import { useState, type FormEvent } from "react";
import "./OwnerAccess.css";

interface OwnerAccessProps {
  isAdmin: boolean;
  onUnlock: (token: string) => Promise<boolean>;
  onLock: () => void;
}

export function OwnerAccess({ isAdmin, onUnlock, onLock }: OwnerAccessProps) {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isAdmin) {
    return (
      <button type="button" className="owner-access__toggle" onClick={onLock}>
        Lock editing
      </button>
    );
  }

  if (!open) {
    return (
      <button type="button" className="owner-access__toggle" onClick={() => setOpen(true)}>
        Owner sign in
      </button>
    );
  }

  function close() {
    setOpen(false);
    setToken("");
    setError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = token.trim();
    if (!trimmed) return;

    setChecking(true);
    setError(null);
    try {
      if (await onUnlock(trimmed)) {
        close();
      } else {
        setError("That token isn't right.");
      }
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <form className="owner-access__form" onSubmit={handleSubmit}>
      <input
        type="password"
        value={token}
        onChange={(event) => setToken(event.target.value)}
        placeholder="Admin token"
        aria-label="Admin token"
        autoComplete="current-password"
        autoFocus
      />
      <button type="submit" disabled={checking}>
        {checking ? "Checking…" : "Unlock"}
      </button>
      <button type="button" onClick={close}>
        Cancel
      </button>
      {error && <p className="owner-access__error">{error}</p>}
    </form>
  );
}
