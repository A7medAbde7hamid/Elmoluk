import { Hono } from "hono";
import { cors } from "hono/cors";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router.js";
import { createContext } from "./context.js";
import { readFile } from "fs/promises";
import { join } from "path";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(cors({ origin: ["http://localhost:5173", "http://localhost:4173"], credentials: true }));
app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));
app.get("/uploads/*", async (c) => {
  try {
    const filePath = join(process.cwd(), "public", c.req.path);
    const content = await readFile(filePath);
    const ext = filePath.split(".").pop()?.toLowerCase() || "";
    const mime: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp" };
    return c.body(content, 200, { "Content-Type": mime[ext] || "application/octet-stream", "Cache-Control": "public, max-age=31536000" });
  } catch {
    return c.notFound();
  }
});
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;
