"use client";

const SESSION_KEY = "finder-visitor-id";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = window.localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return ""; // localStorage bloqueado (modo privado, etc.)
  }
}

type TrackEventData = {
  path?: string;
  productId?: string;
  productName?: string;
  value?: number;
};

// Best-effort: nunca debe romper la interacción del usuario si falla.
export function trackEvent(
  type: "page_view" | "add_to_cart",
  data: TrackEventData = {},
) {
  const sessionId = getSessionId();
  if (!sessionId) return;

  const payload = JSON.stringify({ type, sessionId, ...data });

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/track", blob);
      return;
    }
  } catch {
    // sigue al fetch de abajo
  }

  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}
