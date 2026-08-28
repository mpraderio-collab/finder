import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ChangePasswordForm } from "./ChangePasswordForm";

export default async function AdminAccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  return (
    <div>
      <h1 className="font-heading text-2xl font-extrabold text-ink">
        Mi cuenta
      </h1>
      <p className="mt-1 text-sm text-ink-soft">{session.user.email}</p>

      <div className="mt-8">
        <p className="text-sm font-semibold text-ink">Cambiar contraseña</p>
        <div className="mt-3">
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
