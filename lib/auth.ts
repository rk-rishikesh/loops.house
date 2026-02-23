export type AppRole = "builder" | "host" | "viewer";

const ROLE_KEY = "loops_role";

export function getRole(): AppRole | null {
  if (typeof window === "undefined") return null;
  try {
    const r = localStorage.getItem(ROLE_KEY);
    return r === "builder" || r === "host" || r === "viewer" ? r : null;
  } catch {
    return null;
  }
}

export function setRole(role: AppRole): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ROLE_KEY, role);
  } catch {
    // ignore
  }
}

export function clearRole(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(ROLE_KEY);
  } catch {
    // ignore
  }
}

export function isLoggedIn(): boolean {
  return getRole() !== null;
}
