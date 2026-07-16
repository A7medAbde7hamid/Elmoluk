import bcrypt from "bcryptjs";
import { z } from "zod";
import { eq, desc, like, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery, adminQuery } from "./middleware.js";
import { getDb } from "./queries/connection.js";
import { barbers, barberSchedules, users } from "../../db/schema.js";

export const barberRouter = createRouter({
  // List all barbers (public)
  list: publicQuery
    .input(
      z.object({
        search: z.string().optional(),
        isActive: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      
      if (input?.search) {
        conditions.push(like(barbers.name, `%${input.search}%`));
      }
      if (input?.isActive !== undefined) {
        conditions.push(eq(barbers.isActive, input.isActive));
      }
      
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      
      return db.query.barbers.findMany({
        where,
        orderBy: [desc(barbers.rating)],
      });
    }),

  // Get barber by ID
  byId: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const barber = await db.query.barbers.findFirst({
        where: eq(barbers.id, input.id),
      });
      
      if (!barber) throw new Error("Barber not found");
      
      const schedules = await db.query.barberSchedules.findMany({
        where: eq(barberSchedules.barberId, input.id),
      });
      
      return { ...barber, schedules };
    }),

  // Create barber (admin only)
  create: adminQuery
    .input(
      z.object({
        name: z.string().min(1),
        nameEn: z.string().optional(),
        image: z.string().optional(),
        specialization: z.string().optional(),
        bio: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        password: z.string().optional(),
        salaryType: z.enum(["hourly", "fixed"]).default("fixed"),
        salaryAmount: z.string().default("0"),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { password, ...barberData } = input;
      let userId: number | undefined;
      if (input.email) {
        const existing = await db.query.users.findFirst({ where: eq(users.email, input.email) });
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "البريد الإلكتروني مستخدم بالفعل" });
        const defaultPassword = process.env.BARBER_DEFAULT_PASSWORD || "barber123";
        const hashedPassword = await bcrypt.hash(password || defaultPassword, 10);
        const userResult = await db.insert(users).values({
          name: input.name,
          email: input.email,
          password: hashedPassword,
          role: "barber",
          lastSignInAt: new Date(),
        });
        userId = Number(userResult[0].insertId);
      }
      const result = await db.insert(barbers).values({
        ...barberData,
        userId,
        salaryAmount: parseFloat(input.salaryAmount),
      });
      return { id: Number(result[0].insertId), name: input.name, nameEn: input.nameEn, specialization: input.specialization, bio: input.bio, phone: input.phone, email: input.email, salaryType: input.salaryType, salaryAmount: input.salaryAmount };
    }),

  // Update barber (admin only)
  update: adminQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        nameEn: z.string().optional(),
        image: z.string().optional(),
        specialization: z.string().optional(),
        bio: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        salaryType: z.enum(["hourly", "fixed"]).optional(),
        salaryAmount: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, salaryAmount, ...data } = input;
      const updateData = {
        ...data,
        ...(salaryAmount !== undefined && { salaryAmount: parseFloat(salaryAmount) }),
      };
      await db.update(barbers).set(updateData).where(eq(barbers.id, id));
      return { success: true };
    }),

  // Delete barber (admin only)
  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(barbers).where(eq(barbers.id, input.id));
      return { success: true };
    }),

  // Get barber schedules
  schedules: publicQuery
    .input(z.object({ barberId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.query.barberSchedules.findMany({
        where: eq(barberSchedules.barberId, input.barberId),
      });
    }),

  // Update barber schedule (admin only)
  updateSchedule: adminQuery
    .input(
      z.object({
        barberId: z.number(),
        schedules: z.array(
          z.object({
            dayOfWeek: z.number().min(0).max(6),
            startTime: z.string(),
            endTime: z.string(),
            isDayOff: z.boolean().default(false),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      // Delete existing schedules
      await db.delete(barberSchedules).where(eq(barberSchedules.barberId, input.barberId));
      
      // Insert new schedules
      for (const sched of input.schedules) {
        await db.insert(barberSchedules).values({
          barberId: input.barberId,
          ...sched,
        });
      }
      
      return { success: true };
    }),
});
