import type { NextAuthConfig } from "next-auth";

const PUBLIC_PATHS = ["/login", "/register"];

/** Edge-safe config shared by middleware and the full Auth.js instance. */
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isPublic = PUBLIC_PATHS.includes(request.nextUrl.pathname);
      const loggedIn = Boolean(auth?.user);
      if (isPublic) {
        return loggedIn ? Response.redirect(new URL("/", request.nextUrl)) : true;
      }
      return loggedIn;
    },
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
} satisfies NextAuthConfig;
