"use client";

import { useEffect, useRef } from "react";

// transitions-dev "texts reveal": las líneas hijas (.t-stagger-line--N)
// suben con un desenfoque escalonado cuando el bloque entra en pantalla.
// Se dispara una sola vez — volver a scrollear no repite la animación.
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
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.classList.add("is-shown");
        observer.disconnect();
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={ref as React.Ref<HTMLDivElement>} className={`t-stagger ${className}`}>
      {children}
    </Tag>
  );
}
