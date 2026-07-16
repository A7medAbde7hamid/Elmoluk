import { Hono } from "hono";
import { cors } from "hono/cors";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

async function loadModules() {
  const [router, ctx] = await Promise.all([
    import("../src/server/router.js"),
    import("../src/server/context.js"),
  ]);
  return { appRouter: router.appRouter, createContext: ctx.createContext };
}

let appRouter: any;
let createContext: any;
loadModules().then(m => { appRouter = m.appRouter; createContext = m.createContext; }).catch(err => {
  console.error("[api] init error:", err);
});

const app = new Hono();

const allowedOrigins = ["http://localhost:5173", "http://localhost:4173", "https://elmoluk.vercel.app"];
if (process.env.CORS_ORIGIN) allowedOrigins.push(process.env.CORS_ORIGIN);
app.use(cors({ origin: allowedOrigins, credentials: true }));

app.use("/api/trpc/*", async (c) => {
  if (!appRouter || !createContext) {
    return c.json({ error: "Modules not loaded yet" }, 503);
  }
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});

app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;
