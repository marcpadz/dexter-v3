import { NextResponse } from "next/server";
import { nextAuth } from "@/lib/auth";

const publicPaths = ["/", "/login", "/sign-up", "/api/auth"];

export default nextAuth((req) => {
  const pathname = req.nextUrl.pathname;
  const session = req.auth;

  if (publicPaths.some((path) => pathname.startsWith(path))) {
    if ((pathname === "/login" || pathname === "/sign-up") && session) {
      return NextResponse.redirect(new URL("/chat", req.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/webhook")) {
    return NextResponse.next();
  }

  if (!session) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname.startsWith("/admin") && session.user?.role !== "admin") {
    return NextResponse.redirect(new URL("/chat", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
