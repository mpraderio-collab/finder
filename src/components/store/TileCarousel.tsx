"use client";

import { Children, useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/store/Icons";

// Horizontal tile track (maap.cc swiper): bleeds off the right edge, arrows in
// the header, and a thin progress bar that follows the scroll position.
export function TileCarousel({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(1);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const max = track.scrollWidth - track.clientWidth;
    setVisible(track.scrollWidth > 0 ? track.clientWidth / track.scrollWidth : 1);
    setProgress(max > 0 ? track.scrollLeft / max : 0);
    setAtStart(track.scrollLeft <= 2);
    setAtEnd(track.scrollLeft >= max - 2);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [measure]);

  function scrollByTile(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    const tile = track.firstElementChild as HTMLElement | null;
    const step = tile ? tile.offsetWidth + 8 : track.clientWidth * 0.8;
    track.scrollBy({ left: step * direction, behavior: "smooth" });
  }

  const thumb = Math.min(1, visible);
  const offset = (1 - thumb) * progress;

  return (
    <section className="flex flex-col gap-5 py-12 pl-4 md:py-16 md:pl-8">
      <div className="flex items-center justify-between gap-4 pr-4 md:pr-8">
        <h2 className="e-mono">{title}</h2>
        <div className="flex items-center gap-4">
          {aside}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => scrollByTile(-1)}
              disabled={atStart}
              aria-label="Anterior"
              className="e-carousel-arrow grid h-11 w-11 place-items-center rounded-full hover:bg-e-tile"
            >
              <ArrowLeftIcon size={18} />
            </button>
            <button
              type="button"
              onClick={() => scrollByTile(1)}
              disabled={atEnd}
              aria-label="Siguiente"
              className="e-carousel-arrow grid h-11 w-11 place-items-center rounded-full hover:bg-e-tile"
            >
              <ArrowRightIcon size={18} />
            </button>
          </div>
        </div>
      </div>
      <div
        ref={trackRef}
        onScroll={measure}
        className="flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth pr-4 [scrollbar-width:none] md:pr-8 [&::-webkit-scrollbar]:hidden"
      >
        {Children.map(children, (child) => (
          <div className="w-[72vw] shrink-0 snap-start sm:w-[42vw] lg:w-[340px]">{child}</div>
        ))}
      </div>
      <div className="relative mr-4 h-px max-w-[820px] bg-e-line md:mr-8" aria-hidden="true">
        <span
          className="e-progress-fill absolute inset-y-0 left-0 w-full bg-e-ink"
          style={{
            transform: `translateX(${offset * 100}%) scaleX(${thumb})`,
          }}
        />
      </div>
    </section>
  );
}
