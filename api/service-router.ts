import { z } from "zod";
import { eq, desc, like, and } from "drizzle-orm";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { services } from "@db/schema";

export const serviceRouter = createRouter({
  // List all services (public)
  list: publicQuery
    .input(
      z.object({
        search: z.string().optional(),
        category: z.enum(["haircut", "beard", "skincare", "bath", "other"]).optional(),
        isActive: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      
      if (input?.search) {
        conditions.push(like(services.name, `%${input.search}%`));
      }
      if (input?.category) {
        conditions.push(eq(services.category, input.category));
      }
      if (input?.isActive !== undefined) {
        conditions.push(eq(services.isActive, input.isActive));
      }
      
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      
      return db.query.services.findMany({
        where,
        orderBy: [desc(services.createdAt)],
      });
    }),

  // Get service by ID
  byId: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.query.services.findFirst({
        where: eq(services.id, input.id),
      });
    }),

  // Create service (admin only)
  create: adminQuery
    .input(
      z.object({
        name: z.string().min(1),
        nameEn: z.string().optional(),
        description: z.string().optional(),
        image: z.string().optional(),
        price: z.string().min(1),
        duration: z.number().min(5),
        category: z.enum(["haircut", "beard", "skincare", "bath", "other"]).default("haircut"),
        isHomeService: z.boolean().default(false),
        homeServiceFee: z.string().default("0"),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(services).values({
        ...input,
        price: parseFloat(input.price),
        homeServiceFee: parseFloat(input.homeServiceFee),
      });
      return { id: Number(result[0].insertId), ...input };
    }),

  // Update service (admin only)
  update: adminQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        nameEn: z.string().optional(),
        description: z.string().optional(),
        image: z.string().optional(),
        price: z.string().optional(),
        duration: z.number().optional(),
        category: z.enum(["haircut", "beard", "skincare", "bath", "other"]).optional(),
        isActive: z.boolean().optional(),
        isHomeService: z.boolean().optional(),
        homeServiceFee: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, price, homeServiceFee, ...data } = input;
      const updateData = {
        ...data,
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(homeServiceFee !== undefined && { homeServiceFee: parseFloat(homeServiceFee) }),
      };
      await db.update(services).set(updateData).where(eq(services.id, id));
      return { success: true };
    }),

  // Delete service (admin only)
  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(services).where(eq(services.id, input.id));
      return { success: true };
    }),
});
