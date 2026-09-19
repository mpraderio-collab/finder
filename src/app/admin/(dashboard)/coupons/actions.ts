"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { couponSchema } from "@/lib/validation";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
}

export type CouponActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function createCoupon(
  _prev: CouponActionState,
  formData: FormData,
): Promise<CouponActionState> {
  await requireAdmin();

  const result = couponSchema.safeParse({
    code: formData.get("code"),
    percentOff: formData.get("percentOff"),
    active: formData.get("active") === "on",
  });
  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: "Revisá los campos marcados.", fieldErrors };
  }

  try {
    await db.coupon.create({ data: result.data });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return {
        error: "Ya existe un cupón con ese código.",
        fieldErrors: { code: "Ese código ya está en uso" },
      };
    }
    throw err;
  }

  revalidatePath("/admin/coupons");
  return {};
}

export async function toggleCouponActive(id: string, active: boolean): Promise<{ error?: string }> {
  await requireAdmin();
  await db.coupon.update({ where: { id }, data: { active } });
  revalidatePath("/admin/coupons");
  return {};
}

export async function deleteCoupon(id: string): Promise<{ error?: string }> {
  await requireAdmin();
  try {
    await db.coupon.delete({ where: { id } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
      return { error: "Ya se usó en algún pedido — desactivalo en vez de borrarlo." };
    }
    throw err;
  }
  revalidatePath("/admin/coupons");
  return {};
}
