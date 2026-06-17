import { z } from "zod";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { offers } from "@db/schema";

export const offerRouter = createRouter({
  // List active offers (public)
  list: publicQuery
    .input(
      z.object({
        isActive: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      
      if (input?.isActive !== undefined) {
        conditions.push(eq(offers.isActive, input.isActive));
      } else {
        conditions.push(eq(offers.isActive, true));
      }
      
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      
      return db.query.offers.findMany({
        where,
        orderBy: [desc(offers.createdAt)],
      });
    }),

  // Validate coupon code
  validate: publicQuery
    .input(
      z.object({
        code: z.string(),
        orderAmount: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const today = new Date().toISOString().split("T")[0];
      
      const offer = await db.query.offers.findFirst({
        where: and(
          eq(offers.code, input.code),
          eq(offers.isActive, true),
          gte(offers.endDate, today),
          lte(offers.startDate, today)
        ),
      });
      
      if (!offer) return { valid: false, message: "Invalid or expired code" };
      
      if (offer.usageLimit && offer.usageCount >= offer.usageLimit) {
        return { valid: false, message: "Usage limit reached" };
      }
      
      if (input.orderAmount && parseFloat(input.orderAmount) < Number(offer.minOrderAmount)) {
        return { 
          valid: false, 
          message: `Minimum order amount is ${offer.minOrderAmount}` 
        };
      }
      
      return { valid: true, offer };
    }),

  // Get offer by ID
  byId: adminQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.query.offers.findFirst({
        where: eq(offers.id, input.id),
      });
    }),

  // Create offer (admin only)
  create: adminQuery
    .input(
      z.object({
        code: z.string().min(1),
        name: z.string().min(1),
        description: z.string().optional(),
        discountType: z.enum(["percentage", "fixed"]).default("percentage"),
        discountValue: z.string(),
        maxDiscount: z.string().optional(),
        minOrderAmount: z.string().default("0"),
        usageLimit: z.number().optional(),
        perUserLimit: z.number().default(1),
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(offers).values({
        ...input,
        discountValue: parseFloat(input.discountValue),
        maxDiscount: input.maxDiscount ? parseFloat(input.maxDiscount) : undefined,
        minOrderAmount: parseFloat(input.minOrderAmount),
      });
      return { id: Number(result[0].insertId), ...input };
    }),

  // Update offer (admin only)
  update: adminQuery
    .input(
      z.object({
        id: z.number(),
        code: z.string().optional(),
        name: z.string().optional(),
        description: z.string().optional(),
        discountType: z.enum(["percentage", "fixed"]).optional(),
        discountValue: z.string().optional(),
        maxDiscount: z.string().optional(),
        minOrderAmount: z.string().optional(),
        usageLimit: z.number().optional(),
        perUserLimit: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, startDate, endDate, discountValue, maxDiscount, minOrderAmount, ...data } = input;
      
      const updateData: Record<string, unknown> = { ...data };
      if (startDate) updateData.startDate = startDate;
      if (endDate) updateData.endDate = endDate;
      if (discountValue !== undefined) updateData.discountValue = parseFloat(discountValue);
      if (maxDiscount !== undefined) updateData.maxDiscount = parseFloat(maxDiscount);
      if (minOrderAmount !== undefined) updateData.minOrderAmount = parseFloat(minOrderAmount);
      await db.update(offers).set(updateData).where(eq(offers.id, id));
      return { success: true };
    }),

  // Delete offer (admin only)
  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(offers).where(eq(offers.id, input.id));
      return { success: true };
    }),

  // Increment usage count (called when coupon is used)
  incrementUsage: publicQuery
    .input(z.object({ code: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(offers).set({ usageCount: sql`${offers.usageCount} + 1` }).where(eq(offers.code, input.code));
      return { success: true };
    }),
});
