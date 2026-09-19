const STORAGE_KEY = "careerpilot.session";

export function getSessionKey(): string {
  if (typeof window === "undefined") return "";
  let key = window.localStorage.getItem(STORAGE_KEY);
  if (!key) {
    key = crypto.randomUUID();
    window.localStorage.setItem(STORAGE_KEY, key);
  }
  return key;
}

export function resetSessionKey(): string {
  if (typeof window === "undefined") return "";
  const key = crypto.randomUUID();
  window.localStorage.setItem(STORAGE_KEY, key);
  return key;
}
