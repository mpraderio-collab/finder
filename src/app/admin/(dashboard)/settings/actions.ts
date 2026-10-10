"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { siteSettingsSchema } from "@/lib/validation";
import { SETTINGS_ID } from "@/lib/settings";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
}

export type SettingsActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
};

export async function updateSiteSettings(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  await requireAdmin();

  const result = siteSettingsSchema.safeParse({
    installments: formData.get("installments"),
    mlTaxPercent: formData.get("mlTaxPercent"),
  });
  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: "Revisá los campos marcados.", fieldErrors };
  }

  await db.siteSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, ...result.data },
    update: result.data,
  });

  revalidatePath("/admin/settings");
  revalidatePath("/");
  revalidatePath("/catalogo/[slug]", "page");
  return { success: true };
}
