import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { safeCallbackUrl } from "@/lib/auth/safe-callback";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = Boolean(req.auth);
  if (req.nextUrl.pathname.startsWith("/account") && !isLoggedIn) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", safeCallbackUrl(req.nextUrl.pathname));
    return Response.redirect(url);
  }
});

export const config = {
  matcher: ["/account/:path*"],
};
