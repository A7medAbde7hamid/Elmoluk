import { Hono } from "hono";
import { cors } from "hono/cors";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { migrate } from "drizzle-orm/mysql2/migrator";
import { appRouter } from "../src/server/router.js";
import { createContext } from "../src/server/context.js";
import { getDb } from "../src/server/queries/connection.js";

const app = new Hono();

const allowedOrigins = ["http://localhost:5173", "http://localhost:4173", "https://elmoluk.vercel.app"];
if (process.env.CORS_ORIGIN) allowedOrigins.push(process.env.CORS_ORIGIN);
app.use(cors({ origin: allowedOrigins, credentials: true }));

app.get("/api/trpc/dbcheck", async (c) => {
  try {
    const [rows] = await getDb().$client.execute("SHOW TABLES");
    const tables = (rows as any[]).map((r: any) => Object.values(r)[0]);
    return c.json({ ok: true, tables });
  } catch (e: any) {
    return c.json({ ok: false, error: e.message, stack: e.stack?.split("\n").slice(0, 5).join("\n") }, 500);
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

migrate(getDb(), { migrationsFolder: "./db/migrations" }).catch((e: any) => {
  console.error("Migration failed:", e?.message ?? e);
});

export default app;
