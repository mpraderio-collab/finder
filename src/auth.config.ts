import type { NextAuthConfig } from "next-auth";

// Config liviana, compatible con Edge Runtime: sin providers (que arrastran
// Prisma + bcrypt, incompatibles con Edge y demasiado pesados para el límite
// de tamaño de una Edge Function). El middleware usa solo esto.
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
      const isLoginPage = request.nextUrl.pathname === "/admin/login";
      if (!isAdminRoute || isLoginPage) return true;
      return !!auth?.user;
    },
  },
};
