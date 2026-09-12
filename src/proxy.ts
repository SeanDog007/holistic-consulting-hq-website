import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    return NextResponse.rewrite(new URL("/index.html", request.url));
  }

  if (pathname === "/library/login" || pathname.startsWith("/library/login/")) {
    return NextResponse.redirect(new URL("/library", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/library/:path*"],
};
