import { db } from "@/lib/db";

export function getPublishedStories() {
  return db.customerStory.findMany({
    where: { published: true },
    orderBy: [{ position: "asc" }, { createdAt: "desc" }],
    include: { product: { select: { name: true, slug: true, status: true } } },
  });
}
