import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { COOKIE_NAME, sessionCookie, sessionCookieOptions } from "@/lib/session";
type DiscordProfile = { id: string; username: string; global_name: string | null; avatar: string | null };
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code"), state = request.nextUrl.searchParams.get("state");
  let savedState: { state: string; next: string } | null = null; try { savedState = JSON.parse(request.cookies.get("oauth_state")?.value ?? "null"); } catch { /* invalid cookie */ }
  if (!code || !state || !savedState || state !== savedState.state) return NextResponse.json({ error: "Invalid OAuth state." }, { status: 400 });
  const clientId = process.env.DISCORD_CLIENT_ID, clientSecret = process.env.DISCORD_CLIENT_SECRET, redirectUri = process.env.DISCORD_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) return NextResponse.json({ error: "Discord OAuth is not configured." }, { status: 503 });
  const form = new URLSearchParams({ client_id: clientId, client_secret: clientSecret, grant_type: "authorization_code", code, redirect_uri: redirectUri });
  const tokenResponse = await fetch("https://discord.com/api/oauth2/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form, cache: "no-store" });
  if (!tokenResponse.ok) return NextResponse.json({ error: "Discord token exchange failed." }, { status: 502 });
  const token = await tokenResponse.json() as { access_token?: string };
  if (!token.access_token) return NextResponse.json({ error: "Discord did not return an access token." }, { status: 502 });
  const profileResponse = await fetch("https://discord.com/api/v10/users/@me", { headers: { Authorization: `Bearer ${token.access_token}` }, cache: "no-store" });
  if (!profileResponse.ok) return NextResponse.json({ error: "Could not retrieve the Discord profile." }, { status: 502 });
  const profile = await profileResponse.json() as DiscordProfile;
  const user = await prisma.user.upsert({ where: { discordId: profile.id }, update: { username: profile.username, displayName: profile.global_name || profile.username, avatar: profile.avatar }, create: { discordId: profile.id, username: profile.username, displayName: profile.global_name || profile.username, avatar: profile.avatar } });
  const destination = savedState.next.startsWith("/") && !savedState.next.startsWith("//") ? savedState.next : "/account";
  const response = NextResponse.redirect(new URL(destination, request.url));
  response.cookies.set(COOKIE_NAME, sessionCookie(user.id), sessionCookieOptions);
  response.cookies.set("oauth_state", "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}
