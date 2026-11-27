"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { customerStorySchema } from "@/lib/validation";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
}

export type StoryActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

// id null = historia nueva.
export async function saveStory(
  id: string | null,
  _prev: StoryActionState,
  formData: FormData,
): Promise<StoryActionState> {
  await requireAdmin();

  const result = customerStorySchema.safeParse({
    customerName: formData.get("customerName") ?? "",
    location: formData.get("location"),
    text: formData.get("text") ?? "",
    photoUrl: formData.get("photoUrl"),
    productId: formData.get("productId"),
    position: formData.get("position") || 0,
    published: formData.get("published") === "on",
  });
  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: "Revisá los campos marcados.", fieldErrors };
  }

  // Los opcionales vacíos van como null para que al editar se puedan borrar.
  const data = {
    ...result.data,
    location: result.data.location ?? null,
    photoUrl: result.data.photoUrl ?? null,
    productId: result.data.productId ?? null,
  };
  if (id) await db.customerStory.update({ where: { id }, data });
  else await db.customerStory.create({ data });

  revalidatePath("/");
  revalidatePath("/admin/stories");
  redirect("/admin/stories");
}

export async function deleteStory(id: string): Promise<void> {
  await requireAdmin();
  await db.customerStory.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/admin/stories");
}
