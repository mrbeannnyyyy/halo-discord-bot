import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "halo_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

type SessionPayload = { userId: string; exp: number };

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value) throw new Error("SESSION_SECRET is required for authenticated sessions.");
  return value;
}

function signature(payload: string) {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

function decode(value?: string): SessionPayload | null {
  if (!value) return null;
  const [payload, receivedSignature] = value.split(".");
  if (!payload || !receivedSignature) return null;
  const expectedSignature = signature(payload);
  if (receivedSignature.length !== expectedSignature.length) return null;
  const valid = crypto.timingSafeEqual(Buffer.from(receivedSignature), Buffer.from(expectedSignature));
  if (!valid) return null;
  try {
    const result = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionPayload;
    return result.exp > Date.now() && result.userId ? result : null;
  } catch { return null; }
}

export function sessionCookie(userId: string) {
  const payload = Buffer.from(JSON.stringify({ userId, exp: Date.now() + MAX_AGE_SECONDS * 1000 })).toString("base64url");
  return `${payload}.${signature(payload)}`;
}

export const sessionCookieOptions = {
  httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const,
  path: "/", maxAge: MAX_AGE_SECONDS,
};

export async function currentUser() {
  const value = (await cookies()).get(COOKIE_NAME)?.value;
  const session = decode(value);
  return session ? prisma.user.findUnique({ where: { id: session.userId } }) : null;
}

export async function requireUser(next = "/account") {
  const user = await currentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

export function clearSessionCookie() {
  return { ...sessionCookieOptions, maxAge: 0 };
}

export { COOKIE_NAME };
