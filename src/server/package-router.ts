import { z } from "zod";
import { eq, desc, inArray } from "drizzle-orm";
import { createRouter, publicQuery, adminQuery } from "./middleware.js";
import { getDb } from "./queries/connection.js";
import { packages, packageServices, services } from "../../db/schema.js";

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
      
      // Batch-fetch all package-services and services in 2 queries instead of O(P×S)
      const pkgIds = result.map((p) => p.id);
      const allPkgSvcs = pkgIds.length > 0
        ? await db.query.packageServices.findMany({ where: inArray(packageServices.packageId, pkgIds) })
        : [];
      const allServiceIds = [...new Set(allPkgSvcs.map((ps) => ps.serviceId))];
      const allServices = allServiceIds.length > 0
        ? await db.query.services.findMany({ where: inArray(services.id, allServiceIds) })
        : [];
      const serviceMap = new Map(allServices.map((s) => [s.id, s]));

      const packagesWithServices = result.map((pkg) => {
        const serviceIds = allPkgSvcs.filter((ps) => ps.packageId === pkg.id).map((ps) => ps.serviceId);
        return { ...pkg, services: serviceIds.map((sid) => serviceMap.get(sid)).filter(Boolean) };
      });
      
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
      
      const serviceIds = pkgSvcs.map((ps) => ps.serviceId);
      const serviceDetails = serviceIds.length > 0
        ? await db.query.services.findMany({ where: inArray(services.id, serviceIds) })
        : [];
      
      return { ...pkg, services: serviceDetails };
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
