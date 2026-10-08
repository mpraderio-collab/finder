"use client";

import { useEffect, useRef, useState } from "react";

// maap.cc toolbar behaviour: the bar hides while scrolling down and comes
// back as soon as the user scrolls up.
export function HeaderBar({ children }: { children: React.ReactNode }) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      const delta = y - lastY.current;
      if (Math.abs(delta) < 6) return;
      setHidden(delta > 0 && y > 160);
      lastY.current = y;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-store
      data-hidden={hidden}
      style={{ viewTransitionName: "site-header" }}
      className="e-toolbar sticky top-0 z-40 border-b border-e-line bg-e-bg"
    >
      {children}
    </header>
  );
}
