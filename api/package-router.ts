import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { packages, packageServices, services } from "@db/schema";

export const packageRouter = createRouter({
  // List all packages (public)
  list: publicQuery
    .input(
      z.object({
        isVip: z.boolean().optional(),
        isActive: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db.query.packages.findMany({
        where: input?.isVip !== undefined ? eq(packages.isVip, input.isVip) : undefined,
        orderBy: [desc(packages.createdAt)],
      });
      
      // Get services for each package
      const packagesWithServices = await Promise.all(
        result.map(async (pkg) => {
          const pkgSvcs = await db.query.packageServices.findMany({
            where: eq(packageServices.packageId, pkg.id),
          });
          const serviceIds = pkgSvcs.map((ps) => ps.serviceId);
          const serviceDetails = await Promise.all(
            serviceIds.map(async (sid) => {
              return db.query.services.findFirst({
                where: eq(services.id, sid),
              });
            })
          );
          return { ...pkg, services: serviceDetails.filter(Boolean) };
        })
      );
      
      return packagesWithServices;
    }),

  // Get package by ID with services
  byId: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const pkg = await db.query.packages.findFirst({
        where: eq(packages.id, input.id),
      });
      
      if (!pkg) throw new Error("Package not found");
      
      const pkgSvcs = await db.query.packageServices.findMany({
        where: eq(packageServices.packageId, input.id),
      });
      
      const serviceDetails = await Promise.all(
        pkgSvcs.map(async (ps) => {
          return db.query.services.findFirst({
            where: eq(services.id, ps.serviceId),
          });
        })
      );
      
      return { ...pkg, services: serviceDetails.filter(Boolean) };
    }),

  // Create package (admin only)
  create: adminQuery
    .input(
      z.object({
        name: z.string().min(1),
        nameEn: z.string().optional(),
        description: z.string().optional(),
        image: z.string().optional(),
        originalPrice: z.string().min(1),
        discountedPrice: z.string().min(1),
        discountPercent: z.number().default(0),
        duration: z.number().min(5),
        isVip: z.boolean().default(false),
        serviceIds: z.array(z.number()).min(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { serviceIds, originalPrice, discountedPrice, ...pkgData } = input;
      
      const result = await db.insert(packages).values({
        ...pkgData,
        originalPrice: parseFloat(originalPrice),
        discountedPrice: parseFloat(discountedPrice),
      });
      const packageId = Number(result[0].insertId);
      
      // Insert package services
      for (const serviceId of serviceIds) {
        await db.insert(packageServices).values({ packageId, serviceId });
      }
      
      return { id: packageId, ...pkgData };
    }),

  // Update package (admin only)
  update: adminQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        nameEn: z.string().optional(),
        description: z.string().optional(),
        image: z.string().optional(),
        originalPrice: z.string().optional(),
        discountedPrice: z.string().optional(),
        discountPercent: z.number().optional(),
        duration: z.number().optional(),
        isVip: z.boolean().optional(),
        isActive: z.boolean().optional(),
        serviceIds: z.array(z.number()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, serviceIds, originalPrice, discountedPrice, ...data } = input;
      const updateData = {
        ...data,
        ...(originalPrice !== undefined && { originalPrice: parseFloat(originalPrice) }),
        ...(discountedPrice !== undefined && { discountedPrice: parseFloat(discountedPrice) }),
      };
      
      await db.update(packages).set(updateData).where(eq(packages.id, id));
      
      if (serviceIds) {
        // Delete existing package services
        await db.delete(packageServices).where(eq(packageServices.packageId, id));
        // Insert new ones
        for (const serviceId of serviceIds) {
          await db.insert(packageServices).values({ packageId: id, serviceId });
        }
      }
      
      return { success: true };
    }),

  // Delete package (admin only)
  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(packageServices).where(eq(packageServices.packageId, input.id));
      await db.delete(packages).where(eq(packages.id, input.id));
      return { success: true };
    }),
});
