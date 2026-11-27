import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { DeleteStoryButton } from "./DeleteStoryButton";

export default async function StoriesPage() {
  const stories = await db.customerStory.findMany({
    orderBy: [{ position: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-extrabold text-navy">Historias de clientes</h1>
        <Link
          href="/admin/stories/new"
          className="shrink-0 rounded-lg bg-navy px-5 py-2.5 font-heading text-sm font-bold text-white hover:bg-navy-deep"
        >
          + Nueva historia
        </Link>
      </div>
      <p className="mt-1 max-w-xl text-sm text-ink-soft">
        Se muestran en un carrusel en la portada. Mientras no haya ninguna publicada, la sección no aparece.
      </p>

      {stories.length === 0 ? (
        <p className="mt-10 text-ink-soft">Todavía no cargaste ninguna historia.</p>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {stories.map((story) => (
            <div key={story.id} className="flex items-start gap-4 rounded-xl border border-line bg-bg p-5">
              {story.photoUrl && (
                <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg">
                  <Image src={story.photoUrl} alt="" fill className="object-cover" sizes="64px" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-heading text-sm font-bold text-navy">{story.customerName}</span>
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                      story.published ? "bg-ok-bg text-ok-ink" : "bg-surface text-ink-faint"
                    }`}
                  >
                    {story.published ? "Publicada" : "Oculta"}
                  </span>
                  <span className="text-xs text-ink-faint">Orden {story.position}</span>
                </div>
                <p className="mt-1 line-clamp-2 break-words text-sm text-ink-soft">{story.text}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Link
                  href={`/admin/stories/${story.id}`}
                  className="font-heading text-sm font-bold text-blue hover:text-navy"
                >
                  Editar
                </Link>
                <DeleteStoryButton id={story.id} name={story.customerName} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
