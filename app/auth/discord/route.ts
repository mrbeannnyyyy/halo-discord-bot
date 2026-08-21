import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

function safeNext(value: string | null) { return value === "/apply" || value === "/account" || value === "/dashboard" ? value : "/account"; }

export function GET(request: NextRequest) {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;
  if (!clientId || !redirectUri) return NextResponse.json({ error: "Discord OAuth is not configured." }, { status: 503 });
  const state = crypto.randomBytes(32).toString("base64url");
  const authorizationUrl = new URL("https://discord.com/api/oauth2/authorize");
  authorizationUrl.searchParams.set("client_id", clientId);
  authorizationUrl.searchParams.set("redirect_uri", redirectUri);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("scope", "identify guilds");
  authorizationUrl.searchParams.set("state", state);
  const response = NextResponse.redirect(authorizationUrl);
  response.cookies.set("oauth_state", JSON.stringify({ state, next: safeNext(request.nextUrl.searchParams.get("next")) }), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 600 });
  return response;
}
