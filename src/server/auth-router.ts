import bcrypt from "bcryptjs";
import { z } from "zod";
import * as cookie from "cookie";
import { eq, and, isNull } from "drizzle-orm";
import { Session } from "@contracts/constants";
import { getSessionCookieOptions } from "./lib/cookies.js";
import { createRouter, publicQuery, authedQuery, adminQuery } from "./middleware.js";
import { getDb } from "./queries/connection.js";
import { users, barbers } from "@db/schema";
import { env } from "./lib/env.js";
import { signSessionToken } from "./lib/auth.js";
import { findUserByEmail } from "./queries/users.js";
import { TRPCError } from "@trpc/server";

const SALT_ROUNDS = 12;

export const authRouter = createRouter({
  me: authedQuery.query((opts) => opts.ctx.user),
  logout: authedQuery.mutation(async ({ ctx }) => {
    const opts = getSessionCookieOptions(ctx.req.headers);
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(Session.cookieName, "", {
        httpOnly: opts.httpOnly,
        path: opts.path,
        sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
        secure: opts.secure,
        maxAge: 0,
      }),
    );
    return { success: true };
  }),
  register: publicQuery
    .input(z.object({
      name: z.string().min(1),
      email: z.string().email(),
      phone: z.string().optional(),
      password: z.string().min(6),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const existing = await findUserByEmail(input.email);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "البريد الإلكتروني مستخدم بالفعل" });
      const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);
      const matchingBarber = await db.query.barbers.findFirst({ where: and(eq(barbers.email, input.email), isNull(barbers.userId)) });
      const role = matchingBarber ? "barber" : "user";
      const result = await db.insert(users).values({
        name: input.name,
        email: input.email,
        phone: input.phone,
        password: hashedPassword,
        role,
        lastSignInAt: new Date(),
      });
      const userId = Number(result[0].insertId);
      if (matchingBarber) {
        await db.update(barbers).set({ userId }).where(eq(barbers.id, matchingBarber.id));
      }
      const token = await signSessionToken({ userId, clientId: env.appId });
      const opts = getSessionCookieOptions(ctx.req.headers);
      ctx.resHeaders.append("set-cookie", cookie.serialize(Session.cookieName, token, { ...opts, maxAge: Session.maxAgeMs / 1000 }));
      return { success: true };
    }),
  login: publicQuery
    .input(z.object({
      email: z.string().email(),
      password: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const user = await findUserByEmail(input.email);
      if (!user || !user.password) throw new TRPCError({ code: "UNAUTHORIZED", message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
      const valid = await bcrypt.compare(input.password, user.password);
      if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
      await db.update(users).set({ lastSignInAt: new Date() }).where(eq(users.id, user.id));
      const token = await signSessionToken({ userId: user.id, clientId: env.appId });
      const opts = getSessionCookieOptions(ctx.req.headers);
      ctx.resHeaders.append("set-cookie", cookie.serialize(Session.cookieName, token, { ...opts, maxAge: Session.maxAgeMs / 1000 }));
      return { success: true };
    }),
  linkBarber: adminQuery
    .input(z.object({ userId: z.number(), barberId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(users).set({ role: "barber" }).where(eq(users.id, input.userId));
      await db.update(barbers).set({ userId: input.userId }).where(eq(barbers.id, input.barberId));
      return { success: true };
    }),
});
