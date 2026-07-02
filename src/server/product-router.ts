import { z } from "zod";
import { eq, desc, like, and } from "drizzle-orm";
import { createRouter, publicQuery, adminQuery } from "./middleware.js";
import { getDb } from "./queries/connection.js";
import { products } from "@db/schema";

export const productRouter = createRouter({
  // List all products (public)
  list: publicQuery
    .input(
      z.object({
        search: z.string().optional(),
        category: z.string().optional(),
        isActive: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      
      if (input?.search) {
        conditions.push(like(products.name, `%${input.search}%`));
      }
      if (input?.category) {
        conditions.push(eq(products.category, input.category));
      }
      if (input?.isActive !== undefined) {
        conditions.push(eq(products.isActive, input.isActive));
      }
      
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      
      return db.query.products.findMany({
        where,
        orderBy: [desc(products.createdAt)],
      });
    }),

  // Get product by ID
  byId: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.query.products.findFirst({
        where: eq(products.id, input.id),
      });
    }),

  // Create product (admin only)
  create: adminQuery
    .input(
      z.object({
        name: z.string().min(1),
        nameEn: z.string().optional(),
        description: z.string().optional(),
        image: z.string().optional(),
        price: z.string().min(1),
        stock: z.number().default(0),
        category: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(products).values({
        ...input,
        price: parseFloat(input.price),
      });
      return { id: Number(result[0].insertId), ...input };
    }),

  // Update product (admin only)
  update: adminQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        nameEn: z.string().optional(),
        description: z.string().optional(),
        image: z.string().optional(),
        price: z.string().optional(),
        stock: z.number().optional(),
        category: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, price, ...data } = input;
      const updateData = {
        ...data,
        ...(price !== undefined && { price: parseFloat(price) }),
      };
      await db.update(products).set(updateData).where(eq(products.id, id));
      return { success: true };
    }),

  // Delete product (admin only)
  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(products).where(eq(products.id, input.id));
      return { success: true };
    }),
});
