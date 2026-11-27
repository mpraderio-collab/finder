import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { StoryForm } from "../StoryForm";

// /admin/stories/new carga una historia nueva; cualquier otro id la edita.
export default async function StoryPage(props: PageProps<"/admin/stories/[id]">) {
  const { id } = await props.params;
  const isNew = id === "new";
  const [story, products] = await Promise.all([
    isNew ? null : db.customerStory.findUnique({ where: { id } }),
    db.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!isNew && !story) notFound();

  return (
    <div>
      <h1 className="font-heading text-2xl font-extrabold text-navy">
        {isNew ? "Nueva historia" : "Editar historia"}
      </h1>
      <StoryForm storyId={story?.id ?? null} products={products} defaultValues={story ?? undefined} />
    </div>
  );
}
