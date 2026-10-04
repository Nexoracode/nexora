import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify, SignJWT } from "jose";
import { env } from "@/lib/env";

const COOKIE = "nx_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const secret = () => new TextEncoder().encode(env.SESSION_SECRET);

export function passwordMatches(input: string) {
  const a = Buffer.from(input);
  const b = Buffer.from(env.OWNER_PASSWORD);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function createSession() {
  const token = await new SignJWT({ role: "owner" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secret());
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: env.NODE_ENV === "production", path: "/", maxAge: MAX_AGE_SECONDS });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function isOwner() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, secret());
    return true;
  } catch {
    return false;
  }
}

/** For pages: sends visitors without a valid session to the login page. */
export async function requireOwnerPage() {
  if (!(await isOwner())) redirect("/login");
}

/** For server actions: never trust that the page was gated. */
export async function requireOwnerAction() {
  if (!(await isOwner())) throw new Error("Unauthorized");
}
