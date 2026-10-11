import { COOKIE_NAME } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";

const SESSION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
const KEY_LEN = 64;

function scrypt(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scryptCb(password, salt, KEY_LEN, (err, key) => (err ? reject(err) : resolve(key)))
  );
}

/** Format: scrypt$<saltHex>$<hashHex> */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt);
  return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function secretKey() {
  const secret = process.env.JWT_SECRET ?? "";
  if (secret.length < 16) throw new Error("JWT_SECRET must be set (16+ characters)");
  return new TextEncoder().encode(secret);
}

export function adminConfig() {
  const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const passwordHash = process.env.ADMIN_PASSWORD_HASH ?? "";
  const name = process.env.ADMIN_NAME?.trim() || "مسؤول النظام";
  return { email, passwordHash, name, configured: Boolean(email && passwordHash) };
}

export async function createSessionToken(email: string, name: string): Promise<string> {
  return new SignJWT({ email, name, role: "admin" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(Math.floor((Date.now() + SESSION_MS) / 1000))
    .sign(secretKey());
}

export const SESSION_COOKIE_MS = SESSION_MS;

/** Returns the signed-in admin, or null. Never throws. */
export async function authenticateRequest(req: Request): Promise<User | null> {
  try {
    const token = parseCookieHeader(req.headers.cookie ?? "")[COOKIE_NAME];
    if (!token) return null;
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    const email = typeof payload.email === "string" ? payload.email : "";
    const name = typeof payload.name === "string" ? payload.name : "";
    // Session is only valid while it matches the configured admin account.
    if (!email || email !== adminConfig().email) return null;
    const now = new Date();
    return {
      id: 1,
      openId: `admin:${email}`,
      name,
      email,
      loginMethod: "password",
      role: "admin",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
    };
  } catch {
    return null;
  }
}
