export const AUTH_COMPLETE_EVENT = "bs:auth-complete";
const AUTH_COMPLETE_STORAGE_KEY = "bs_auth_event";

export function notifyAuthCompleted() {
  if (typeof window === "undefined") {
    return;
  }

  const stamp = `${Date.now()}`;
  window.localStorage.setItem(AUTH_COMPLETE_STORAGE_KEY, stamp);

  if (window.opener && !window.opener.closed) {
    window.opener.postMessage({ type: AUTH_COMPLETE_EVENT, stamp }, window.location.origin);
  }
}

export function completeAuthFlow(fallbackUrl = "/") {
  if (typeof window === "undefined") {
    return;
  }

  notifyAuthCompleted();

  window.sessionStorage.removeItem("bs_pending_email");
  window.sessionStorage.removeItem("bs_pending_phone");

  if (window.opener && !window.opener.closed) {
    window.opener.focus();
    window.close();

    window.setTimeout(() => {
      window.location.replace(fallbackUrl);
    }, 300);
    return;
  }

  window.location.replace(fallbackUrl);
}
