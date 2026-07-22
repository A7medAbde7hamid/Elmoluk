import { ErrorMessages } from "../../contracts/constants.js";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context.js";

// Simple in-memory rate limiter (per-Vercel-instance, good enough for burst protection)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 30; // max requests per window per IP

function rateLimiter(ip: string) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const createRouter = t.router;
export const publicQuery = t.procedure;

const requireAuth = t.middleware(async (opts) => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: ErrorMessages.unauthenticated,
    });
  }

  return next({ ctx: { ...ctx, user: ctx.user } });
});

function requireRole(...roles: string[]) {
  return t.middleware(async (opts) => {
    const { ctx, next } = opts;

    if (!ctx.user || !roles.includes(ctx.user.role)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: ErrorMessages.insufficientRole,
      });
    }

    return next({ ctx: { ...ctx, user: ctx.user } });
  });
}

export const authedQuery = t.procedure.use(requireAuth);
export const adminQuery = authedQuery.use(requireRole("admin", "manager"));

export const barberQuery = authedQuery.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || (ctx.user.role !== "admin" && ctx.user.role !== "barber")) {
      throw new TRPCError({ code: "FORBIDDEN", message: ErrorMessages.insufficientRole });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);

// Rate-limited public query (use for endpoints that don't need auth but need protection)
export const rateLimitedPublicQuery = t.procedure.use(
  t.middleware(async (opts) => {
    const ip = opts.ctx.req.headers.get("x-forwarded-for") || opts.ctx.req.headers.get("x-real-ip") || "unknown";
    if (!rateLimiter(ip)) {
      throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "طلبات كثيرة جداً. حاول بعد دقيقة." });
    }
    return opts.next();
  }),
);
