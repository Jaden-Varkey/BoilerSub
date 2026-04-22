const AUTH_KEY = "boilersub_auth";
const PENDING_KEY = "boilersub_pending";

export function loadAuth() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY) || "null");
  } catch {
    return null;
  }
}

export function saveAuth(value) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(value));
}

export function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
}

export function loadPending() {
  try {
    return JSON.parse(localStorage.getItem(PENDING_KEY) || "null");
  } catch {
    return null;
  }
}

export function savePending(value) {
  localStorage.setItem(PENDING_KEY, JSON.stringify(value));
}

export function clearPending() {
  localStorage.removeItem(PENDING_KEY);
}
