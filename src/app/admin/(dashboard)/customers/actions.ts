"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { customerSchema } from "@/lib/validation";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
}

export type CustomerActionState = {
  error?: string;
  success?: boolean;
};

export async function updateCustomer(
  customerId: string,
  _prev: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  await requireAdmin();

  const parsed = customerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    city: formData.get("city"),
    province: formData.get("province"),
    zip: formData.get("zip"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisá los datos." };
  }

  try {
    await db.customer.update({ where: { id: customerId }, data: parsed.data });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
      return { error: "Ya hay otro cliente con ese email." };
    }
    throw err;
  }

  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${customerId}`);
  return { success: true };
}
