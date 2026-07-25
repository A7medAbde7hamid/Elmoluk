import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createRouter, adminQuery, authedQuery } from "./middleware.js";
import { getDb } from "./queries/connection.js";
import { orders, orderItems, products } from "../../db/schema.js";

export const orderRouter = createRouter({
  // List orders (admin)
  list: adminQuery
    .input(
      z.object({
        status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]).optional(),
        limit: z.number().default(50),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const where = input?.status ? eq(orders.status, input.status) : undefined;
      
      return db.query.orders.findMany({
        where,
        orderBy: [desc(orders.createdAt)],
        limit: input?.limit,
      });
    }),

  // Get user's orders
  myOrders: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.query.orders.findMany({
      where: eq(orders.userId, ctx.user.id),
      orderBy: [desc(orders.createdAt)],
    });
  }),

  // Get order by ID with items (ownership check)
  byId: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, input.id),
      });
      
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      if (order.userId !== ctx.user.id && ctx.user.role !== "admin" && ctx.user.role !== "manager") {
        throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحية" });
      }
      
      const items = await db.query.orderItems.findMany({
        where: eq(orderItems.orderId, input.id),
      });
      
      const enrichedItems = await Promise.all(
        items.map(async (item) => {
          const product = await db.query.products.findFirst({
            where: eq(products.id, item.productId),
          });
          return { ...item, product };
        })
      );
      
      return { ...order, items: enrichedItems };
    }),

  // Create order (server-calculates prices from products table)
  create: authedQuery
    .input(
      z.object({
        items: z.array(
          z.object({
            productId: z.number(),
            quantity: z.number().min(1),
          })
        ).min(1),
        shippingAddress: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      
      // Fetch prices from DB + check stock — client-supplied prices are IGNORED
      let totalAmount = 0;
      const resolvedItems: { productId: number; quantity: number; unitPrice: number; totalPrice: number }[] = [];
      
      for (const item of input.items) {
        const product = await db.query.products.findFirst({ where: eq(products.id, item.productId) });
        if (!product) throw new TRPCError({ code: "NOT_FOUND", message: `المنتج غير موجود: ${item.productId}` });
        if (product.stock < item.quantity) throw new TRPCError({ code: "BAD_REQUEST", message: `المنتج "${product.name}" غير متوفر بالكمية المطلوبة (المتوفر: ${product.stock})` });
        const unitPrice = Number(product.price);
        const totalPrice = unitPrice * item.quantity;
        totalAmount += totalPrice;
        resolvedItems.push({ productId: item.productId, quantity: item.quantity, unitPrice, totalPrice });
      }
      
      const result = await db.insert(orders).values({
        userId: ctx.user.id,
        totalAmount,
        shippingAddress: input.shippingAddress,
        status: "pending",
        paymentStatus: "pending",
      });
      
      const orderId = Number(result[0].insertId);
      
      for (const item of resolvedItems) {
        await db.insert(orderItems).values({
          orderId,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        });
        await db.update(products).set({ stock: sql`${products.stock} - ${item.quantity}` }).where(eq(products.id, item.productId));
      }
      
      return { id: orderId, totalAmount };
    }),

  // Update order status (admin)
  updateStatus: adminQuery
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(orders).set({ status: input.status }).where(eq(orders.id, input.id));
      return { success: true };
    }),
});
