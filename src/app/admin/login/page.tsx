import Image from "next/image";
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
    <div className="flex min-h-screen items-center justify-center bg-surface px-6">
      <div className="grid w-full max-w-[660px] grid-cols-1 overflow-hidden rounded-2xl border border-line sm:min-h-[440px] sm:grid-cols-2">
        <div className="flex flex-col justify-between bg-navy-deep p-[30px_26px]">
          <Image
            src="/brand/finder-logo-white.png"
            alt="Finder"
            width={1463}
            height={303}
            className="h-5 w-auto"
          />
          <div>
            <p className="font-heading text-xl font-bold leading-[1.35] text-white">
              &ldquo;Si no lo usaríamos en nuestra propia casa, no lo
              vendemos.&rdquo;
            </p>
            <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.16em] text-amber">
              Panel de administración
            </p>
          </div>
        </div>
        <div className="flex flex-col justify-center bg-bg p-[38px_30px]">
          <h1 className="font-heading text-[26px] font-extrabold text-navy">
            Ingresar
          </h1>
          <form action={login} className="mt-6 flex flex-col gap-4">
            {hasError && (
              <p className="rounded-[10px] border border-err-line bg-err-bg px-3 py-2 text-sm text-err-ink">
                Email o contraseña incorrectos.
              </p>
            )}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-[13px] font-semibold text-ink">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="rounded-lg border border-border-input bg-bg px-3.5 py-3 text-sm outline-none focus:border-amber focus:shadow-[0_0_0_3px_rgba(240,160,28,0.15)]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-[13px] font-semibold text-ink"
              >
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="rounded-lg border border-border-input bg-bg px-3.5 py-3 text-sm outline-none focus:border-amber focus:shadow-[0_0_0_3px_rgba(240,160,28,0.15)]"
              />
            </div>
            <button
              type="submit"
              className="mt-2 rounded-lg bg-navy px-5 py-3 font-heading text-sm font-bold text-white transition-colors hover:bg-navy-deep"
            >
              Ingresar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
