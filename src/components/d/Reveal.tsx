"use client";

import { useEffect, useRef } from "react";

// transitions-dev texts reveal, played once when the block scrolls into view.
// Children mark their lines with `t-stagger-line t-stagger-line--N`.
export function Reveal({
  as: Tag = "div",
  className = "",
  children,
}: {
  as?: "div" | "section" | "header";
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Already on screen when the page loads: leave it visible (the page
    // crossfade is its entrance). Hiding it now would flash the content.
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;
    el.classList.add("is-armed");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.classList.remove("is-shown");
        void el.offsetHeight; // reflow so the entrance plays from the start
        el.classList.add("is-shown");
        observer.disconnect();
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={ref as React.RefObject<never>} className={`t-stagger ${className}`}>
      {children}
    </Tag>
  );
}
