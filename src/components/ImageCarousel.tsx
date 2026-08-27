"use client";

import Image from "next/image";
import { useState } from "react";

type CarouselImage = { id: string; url: string };

export function ImageCarousel({
  images,
  alt,
}: {
  images: CarouselImage[];
  alt: string;
}) {
  const [index, setIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-cream-soft" />
    );
  }

  const goTo = (i: number) => setIndex((i + images.length) % images.length);

  return (
    <div className="flex flex-col gap-3">
      <div
        className="group relative aspect-square w-full overflow-hidden rounded-3xl bg-cream-soft"
        role="region"
        aria-roledescription="carousel"
        aria-label={alt}
      >
        <Image
          src={images[index].url}
          alt={alt}
          fill
          priority={index === 0}
          className="object-cover"
          sizes="(min-width: 768px) 50vw, 100vw"
        />

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label="Foto anterior"
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-cream/90 text-ink opacity-0 shadow transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label="Foto siguiente"
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-cream/90 text-ink opacity-0 shadow transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
            >
              ›
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Ir a la foto ${i + 1}`}
                  aria-current={i === index}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? "w-5 bg-cream" : "w-1.5 bg-cream/60"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Ver foto ${i + 1}`}
              aria-current={i === index}
              className={`relative aspect-square overflow-hidden rounded-xl border-2 bg-cream-soft transition-colors ${
                i === index ? "border-ink" : "border-transparent"
              }`}
            >
              <Image
                src={img.url}
                alt=""
                fill
                className="object-cover"
                sizes="150px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
