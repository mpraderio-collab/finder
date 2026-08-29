"use client";

import { useEffect, useRef } from "react";

// transitions-dev success check: fades in, rotates upright, bobs and draws
// its stroke. Path length is measured on mount (dynamic approach) since we
// can't hand-measure getTotalLength() for this checkmark ahead of time.
export function SuccessCheck() {
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const path = pathRef.current;
    if (!wrapper || !path) return;

    const len = Math.ceil(path.getTotalLength()) + 1;
    path.style.strokeDasharray = String(len);
    path.style.strokeDashoffset = String(len);

    requestAnimationFrame(() => {
      wrapper.setAttribute("data-state", "in");
    });
  }, []);

  return (
    <span
      ref={wrapperRef}
      className="t-success-check"
      data-state="out"
      aria-hidden="true"
    >
      <svg viewBox="0 0 48 48" fill="none" width="28" height="28">
        <path
          ref={pathRef}
          d="M10 24l9 9 19-19"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
