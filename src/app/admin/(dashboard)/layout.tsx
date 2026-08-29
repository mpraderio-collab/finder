import Image from "next/image";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { AdminNav } from "./AdminNav";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="hidden w-[236px] shrink-0 flex-col bg-navy-deep text-white md:flex">
        <div className="px-6 py-6">
          <Image
            src="/brand/finder-logo-white.png"
            alt="Finder"
            width={1463}
            height={303}
            className="h-5 w-auto"
          />
          <p className="mt-1.5 text-xs text-white/60">
            Panel de administración
          </p>
        </div>
        <AdminNav />
        <div className="border-t border-white/12 p-3">
          <p className="truncate px-3 py-1 text-xs text-white/50">
            {session.user.email}
          </p>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/admin/login" });
            }}
          >
            <button
              type="submit"
              className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-white/78 transition-colors hover:bg-white/12 hover:text-white"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 px-6 py-8 md:px-10">{children}</main>
    </div>
  );
}
