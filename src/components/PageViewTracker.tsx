"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/analytics";

// No se registran visitas dentro de /admin: son de vos administrando el
// sitio, no de un visitante real, y ensuciarían las métricas.
export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    trackEvent("page_view", { path: pathname });
  }, [pathname]);

  return null;
}
