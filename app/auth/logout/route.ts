import { NextResponse } from "next/server";
import { clearSessionCookie, COOKIE_NAME } from "@/lib/session";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url), { status: 303 });
  response.cookies.set(COOKIE_NAME, "", clearSessionCookie());
  return response;
}
