import { redirect } from "next/navigation";
import { signIn, auth } from "@/auth";
import { AuthError } from "next-auth";

async function login(formData: FormData) {
  "use server";
  const email = formData.get("email");
  const password = formData.get("password");
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/admin",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/admin/login?error=1");
    }
    throw error;
  }
}

export default async function AdminLoginPage(
  props: PageProps<"/admin/login">,
) {
  const session = await auth();
  if (session?.user) redirect("/admin");

  const searchParams = await props.searchParams;
  const hasError = searchParams?.error === "1";

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-6">
      <div className="w-full max-w-sm rounded-2xl bg-cream p-8 shadow-xl">
        <p className="font-heading text-2xl font-extrabold text-ink">
          Finder<span className="text-amber">.</span>{" "}
          <span className="text-base font-medium text-ink-soft">Admin</span>
        </p>
        <form action={login} className="mt-6 flex flex-col gap-4">
          {hasError && (
            <p className="rounded-lg bg-coral-soft px-3 py-2 text-sm text-coral">
              Email o contraseña incorrectos.
            </p>
          )}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-ink">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="rounded-lg border border-line bg-card px-3 py-2 text-sm outline-none focus:border-amber"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-sm font-medium text-ink"
            >
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="rounded-lg border border-line bg-card px-3 py-2 text-sm outline-none focus:border-amber"
            />
          </div>
          <button
            type="submit"
            className="mt-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-amber-dark"
          >
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}
