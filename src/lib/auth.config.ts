import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt" as const,
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.language = user.language;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as never;
        session.user.language = token.language as string;
      }
      return session;
    },
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isLoginPage = request.nextUrl.pathname === "/login";
      const isPublic =
        request.nextUrl.pathname.startsWith("/api/auth") ||
        request.nextUrl.pathname.startsWith("/uploads") ||
        request.nextUrl.pathname.match(/\.(png|jpg|jpeg|svg|pdf|ico|json|webp)$/);

      if (isPublic) return true;
      if (!isLoggedIn && !isLoginPage) return false;
      if (isLoggedIn && isLoginPage) {
        return Response.redirect(new URL("/dashboard", request.nextUrl));
      }

      const role = auth?.user?.role;
      const path = request.nextUrl.pathname;

      if (role === "PRICER") {
        if (
          path === "/orders/new" ||
          path.startsWith("/orders/") ||
          path === "/orders" ||
          path === "/invoices" ||
          path.startsWith("/invoices/") ||
          path === "/archive" ||
          path.startsWith("/archive/") ||
          path.startsWith("/customers") ||
          path.startsWith("/admin")
        ) {
          return Response.redirect(new URL("/pricing", request.nextUrl));
        }
      }

      if (role === "ORDER_TAKER") {
        if (path.startsWith("/admin") || path.startsWith("/pricing")) {
          return Response.redirect(new URL("/dashboard", request.nextUrl));
        }
      }

      return true;
    },
  },
  trustHost: true,
  secret: process.env.AUTH_SECRET,
} satisfies NextAuthConfig;
