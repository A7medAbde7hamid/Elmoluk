import { z } from "zod";
import { createRouter, authedQuery } from "./middleware.js";
import { TRPCError } from "@trpc/server";
import cloudinary from "./lib/cloudinary.js";

const ALLOWED_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function validateImage(input: { fileName: string; base64: string }) {
  const ext = input.fileName.split(".").pop()?.toLowerCase() || "";
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "نوع الملف غير مسموح به" });
  }
  const match = input.base64.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!match) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "تنسيق الصورة غير صحيح" });
  }
  const raw = match[2];
  const buffer = Buffer.from(raw, "base64");
  if (buffer.length > MAX_FILE_SIZE) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "حجم الصورة يتجاوز 5 ميجابايت" });
  }
  return { ext, buffer };
}

async function uploadImage(prefix: string, input: { fileName: string; base64: string }) {
  const { ext, buffer } = validateImage(input);
  const publicId = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const dataUri = `data:image/${ext};base64,${buffer.toString("base64")}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    public_id: publicId,
    folder: "elmoluk",
    resource_type: "image",
  });
  return { url: result.secure_url };
}

export const uploadRouter = createRouter({
  receipt: authedQuery
    .input(z.object({ fileName: z.string(), base64: z.string() }))
    .mutation(async ({ input }) => {
      try {
        return await uploadImage("receipt", input);
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "فشل رفع الملف" });
      }
    }),
  productImage: authedQuery
    .input(z.object({ fileName: z.string(), base64: z.string() }))
    .mutation(async ({ input }) => {
      try {
        return await uploadImage("product", input);
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "فشل رفع الصورة" });
      }
    }),
});
