import { cookies } from "next/headers";
import { db } from "@/db";
import { workspaceUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const SESSION_COOKIE = "ie_ws_session";

function getSecret(): string {
  const s = process.env.WORKSPACE_SECRET;
  if (!s) throw new Error("WORKSPACE_SECRET environment variable is required");
  return s;
}

function sign(payload: string): string {
  const hmac = crypto.createHmac("sha256", getSecret());
  hmac.update(payload);
  return `${payload}.${hmac.digest("hex")}`;
}

function verify(token: string): string | null {
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return null;
  const payload = token.substring(0, lastDot);
  const expected = sign(payload);
  if (token.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected))) return null;
  return payload;
}

export async function createSession(userId: string) {
  const jar = await cookies();
  const token = sign(userId);
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const userId = verify(token);
  if (!userId) return null;

  const [user] = await db
    .select({
      id: workspaceUsers.id,
      email: workspaceUsers.email,
      role: workspaceUsers.role,
    })
    .from(workspaceUsers)
    .where(eq(workspaceUsers.id, userId));

  return user || null;
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(password)) return "Password must contain an uppercase letter";
  if (!/[a-z]/.test(password)) return "Password must contain a lowercase letter";
  if (!/[0-9]/.test(password)) return "Password must contain a number";
  if (!/[^A-Za-z0-9]/.test(password)) return "Password must contain a special character";
  return null;
}

export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, 64, (err, derived) => {
      if (err) reject(err);
      resolve(`${salt}:${derived.toString("hex")}`);
    });
  });
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(":");
    crypto.scrypt(password, salt, 64, (err, derived) => {
      if (err) reject(err);
      resolve(crypto.timingSafeEqual(Buffer.from(key, "hex"), derived));
    });
  });
}
