import * as jose from "jose";
import * as cookie from "cookie";
import { TRPCError } from "@trpc/server";
import { env } from "./env.js";
import { Session } from "../../../contracts/constants.js";
import { findUserById } from "../queries/users.js";

export type SessionPayload = {
  userId: number;
  clientId: string;
};

const JWT_ALG = "HS256";

export async function signSessionToken(
  payload: SessionPayload,
): Promise<string> {
  const secret = new TextEncoder().encode(env.appSecret);
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime("7 days")
    .sign(secret);
}

async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  if (!token) {
    console.warn("[session] No token provided for verification.");
    return null;
  }
  try {
    const secret = new TextEncoder().encode(env.appSecret);
    const { payload } = await jose.jwtVerify(token, secret, {
      algorithms: [JWT_ALG],
    });
    const { userId, clientId } = payload;
    if (!userId || !clientId) {
      console.warn("[session] JWT payload missing required fields.");
      return null;
    }
    return { userId: Number(userId), clientId } as SessionPayload;
  } catch (error) {
    console.warn("[session] JWT verification failed:", error);
    return null;
  }
}

export async function authenticateRequest(headers: Headers) {
  const cookies = cookie.parse(headers.get("cookie") || "");
  const token = cookies[Session.cookieName];
  if (!token) {
    console.warn("[auth] No session cookie found in request.");
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid authentication token." });
  }
  const claim = await verifySessionToken(token);
  if (!claim) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid authentication token." });
  }
  const user = await findUserById(claim.userId);
  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found. Please re-login." });
  }
  return user;
}
