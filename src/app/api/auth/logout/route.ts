import { NextResponse } from "next/server";
import { sessionCookieName } from "@/lib/auth";

export async function POST(request: Request) {
  const url = new URL("/library/login", request.url);
  const response = NextResponse.redirect(url, 303);
  response.cookies.set(sessionCookieName(), "", { path: "/", maxAge: 0 });
  return response;
}
