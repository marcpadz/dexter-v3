import { betterFetch } from "@better-fetch/fetch";
import type { Session } from "better-auth/types";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { data: session } = await betterFetch<Session>(
    "/api/auth/get-session",
    {
      baseURL: request.nextUrl.origin,
      headers: { cookie: request.headers.get("cookie") || "" },
    },
  );

  if (!session) {
    if (request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/sign-up") || request.nextUrl.pathname.startsWith("/api/auth")) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session && (request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/sign-up"))) {
     return NextResponse.redirect(new URL("/chat", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth).*)'],
}
