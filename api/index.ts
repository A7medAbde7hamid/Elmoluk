import { Hono } from "hono";
import { cors } from "hono/cors";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

let appRouter: any, createContext: any;
let initError: string | null = null;

try {
  const mod = await import("../src/server/router.js");
  appRouter = mod.appRouter;
} catch (e: any) {
  initError = "[router] " + (e?.message || String(e));
}
try {
  const mod = await import("../src/server/context.js");
  createContext = mod.createContext;
} catch (e: any) {
  initError = (initError ? initError + " | " : "") + "[ctx] " + (e?.message || String(e));
}

const app = new Hono();

const allowedOrigins = ["http://localhost:5173", "http://localhost:4173", "https://elmoluk.vercel.app"];
if (process.env.CORS_ORIGIN) allowedOrigins.push(process.env.CORS_ORIGIN);
app.use(cors({ origin: allowedOrigins, credentials: true }));

app.use("/api/trpc/*", async (c) => {
  if (initError) return c.json({ error: "Init failed", details: initError }, 500);
  if (!appRouter || !createContext) return c.json({ error: "Modules not loaded" }, 503);
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});

app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;
