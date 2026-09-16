"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
}

export async function approveReview(id: string): Promise<{ error?: string }> {
  await requireAdmin();

  const review = await db.review.update({
    where: { id },
    data: { approved: true },
    select: { product: { select: { slug: true } } },
  });

  revalidatePath("/admin/reviews");
  revalidatePath(`/catalogo/${review.product.slug}`);
  return {};
}

export async function rejectReview(id: string): Promise<{ error?: string }> {
  await requireAdmin();

  await db.review.delete({ where: { id } });

  revalidatePath("/admin/reviews");
  return {};
}
