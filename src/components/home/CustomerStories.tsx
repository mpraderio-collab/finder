import Image from "next/image";
import Link from "next/link";
import { TileCarousel } from "@/components/store/TileCarousel";

export type CustomerStoryItem = {
  id: string;
  customerName: string;
  location: string | null;
  text: string;
  photoUrl: string | null;
  product: { name: string; slug: string; status: string } | null;
};

export function CustomerStories({ stories }: { stories: CustomerStoryItem[] }) {
  return (
    <TileCarousel title="Historias de clientes">
      {stories.map((story) => (
        <article key={story.id} className="flex h-full flex-col bg-e-tile">
          {story.photoUrl && (
            <div className="relative aspect-[4/5] w-full">
              <Image
                src={story.photoUrl}
                alt={`Foto de ${story.customerName}`}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 340px, 72vw"
              />
            </div>
          )}
          <div className="flex flex-1 flex-col justify-between gap-6 p-5">
            {/* Sin foto, la tarjeta se sostiene con el texto más grande. */}
            <blockquote
              className={`whitespace-pre-line break-words leading-snug tracking-[-0.01em] ${
                !story.photoUrl && story.text.length <= 200 ? "text-[26px]" : "text-[17px]"
              }`}
            >
              &ldquo;{story.text}&rdquo;
            </blockquote>
            <div className="flex flex-col gap-1">
              <span className="text-[13px]">
                {story.customerName}
                {story.location && <span className="text-e-muted"> · {story.location}</span>}
              </span>
              {/* Solo enlaza productos que siguen a la venta. */}
              {story.product?.status === "active" && (
                <Link
                  href={`/catalogo/${story.product.slug}`}
                  transitionTypes={["nav-forward"]}
                  className="e-mono w-fit text-e-muted underline underline-offset-4"
                >
                  {story.product.name}
                </Link>
              )}
            </div>
          </div>
        </article>
      ))}
    </TileCarousel>
  );
}
