import { Hono } from "hono";
import { cors } from "hono/cors";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../src/server/router.js";
import { createContext } from "../src/server/context.js";

const app = new Hono();

const allowedOrigins = ["http://localhost:5173", "http://localhost:4173", "https://elmoluk.vercel.app"];
if (process.env.CORS_ORIGIN) allowedOrigins.push(process.env.CORS_ORIGIN);
app.use(cors({ origin: allowedOrigins, credentials: true }));

app.use("/api/trpc/*", async (c) => {
  const method = c.req.method;
  const ct = c.req.header("content-type") || "none";
  let body: any = null;
  let bodyStr = "unread";
  try {
    bodyStr = await c.req.raw.clone().text();
  } catch {
    bodyStr = "error reading body";
  }
  console.log("[trpc]", method, c.req.path, "ct:", ct, "body:", bodyStr.substring(0, 500));
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});

app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;
