import { NextResponse, type NextRequest } from "next/server";
import { isLibraryGateEnabled, sessionCookieName, verifySessionToken } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === "/") {
    return NextResponse.rewrite(new URL("/index.html", request.url));
  }

  if (!pathname.startsWith("/library")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/library/login") || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  if (!isLibraryGateEnabled()) {
    return NextResponse.next();
  }

  const token = request.cookies.get(sessionCookieName())?.value;
  if (await verifySessionToken(token)) {
    return NextResponse.next();
  }

  const login = request.nextUrl.clone();
  login.pathname = "/library/login";
  login.search = "";
  login.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/", "/library/:path*"],
};
