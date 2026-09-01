"use client";

const SESSION_KEY = "finder-visitor-id";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

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

type EventType = "page_view" | "view_content" | "add_to_cart" | "initiate_checkout";

type TrackEventData = {
  path?: string;
  productId?: string;
  productName?: string;
  value?: number;
};

const META_EVENT_NAMES: Record<EventType, string> = {
  page_view: "PageView",
  view_content: "ViewContent",
  add_to_cart: "AddToCart",
  initiate_checkout: "InitiateCheckout",
};

function trackMetaPixel(type: EventType, data: TrackEventData) {
  if (typeof window === "undefined" || !window.fbq) return;

  const params: Record<string, unknown> = { currency: "ARS" };
  if (data.value !== undefined) params.value = data.value;
  if (data.productId) params.content_ids = [data.productId];
  if (data.productName) params.content_name = data.productName;
  if (type !== "page_view") params.content_type = "product";

  window.fbq("track", META_EVENT_NAMES[type], params);
}

// Best-effort: nunca debe romper la interacción del usuario si falla.
export function trackEvent(type: EventType, data: TrackEventData = {}) {
  trackMetaPixel(type, data);

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
