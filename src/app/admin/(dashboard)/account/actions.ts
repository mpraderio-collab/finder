"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Ingresá tu contraseña actual"),
    newPassword: z.string().min(8, "La nueva contraseña necesita al menos 8 caracteres"),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas nuevas no coinciden",
    path: ["confirmPassword"],
  });

export type ChangePasswordState = {
  error?: string;
  success?: boolean;
};

export async function changePassword(
  _prev: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const session = await auth();
  if (!session?.user?.email) redirect("/admin/login");

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const admin = await db.adminUser.findUnique({
    where: { email: session.user.email },
  });
  if (!admin) return { error: "Usuario no encontrado." };

  const valid = await bcrypt.compare(parsed.data.currentPassword, admin.passwordHash);
  if (!valid) return { error: "La contraseña actual no es correcta." };

  const newHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await db.adminUser.update({
    where: { id: admin.id },
    data: { passwordHash: newHash },
  });

  return { success: true };
}
