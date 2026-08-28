import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";

const navLinks = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/products", label: "Productos" },
  { href: "/admin/orders", label: "Pedidos" },
  { href: "/admin/account", label: "Mi cuenta" },
];

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  return (
    <div className="flex min-h-screen bg-cream-soft">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-ink text-cream md:flex">
        <div className="px-6 py-6">
          <p className="font-heading text-xl font-extrabold">
            Finder<span className="text-amber">.</span>
          </p>
          <p className="mt-0.5 text-xs text-cream/60">Panel de administración</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-cream/80 transition-colors hover:bg-cream/10 hover:text-cream"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-cream/10 p-3">
          <p className="truncate px-3 py-1 text-xs text-cream/50">
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
              className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-cream/80 transition-colors hover:bg-cream/10 hover:text-cream"
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
