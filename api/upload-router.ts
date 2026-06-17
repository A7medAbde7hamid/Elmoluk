import { z } from "zod";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { createRouter, authedQuery } from "./middleware";
import { TRPCError } from "@trpc/server";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

export const uploadRouter = createRouter({
  receipt: authedQuery
    .input(z.object({
      fileName: z.string(),
      base64: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        await mkdir(UPLOAD_DIR, { recursive: true });
        const ext = input.fileName.split(".").pop() || "png";
        const name = `receipt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const buffer = Buffer.from(input.base64.split(",")[1] || input.base64, "base64");
        await writeFile(join(UPLOAD_DIR, name), buffer);
        return { url: `/uploads/${name}` };
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "فشل رفع الملف" });
      }
    }),
  productImage: authedQuery
    .input(z.object({
      fileName: z.string(),
      base64: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        await mkdir(UPLOAD_DIR, { recursive: true });
        const ext = input.fileName.split(".").pop() || "png";
        const name = `product_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const buffer = Buffer.from(input.base64.split(",")[1] || input.base64, "base64");
        await writeFile(join(UPLOAD_DIR, name), buffer);
        return { url: `/uploads/${name}` };
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "فشل رفع الصورة" });
      }
    }),
});
