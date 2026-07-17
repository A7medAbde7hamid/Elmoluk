import { Hono } from "hono";
import { cors } from "hono/cors";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../src/server/router.js";
import { createContext } from "../src/server/context.js";

const app = new Hono();

const allowedOrigins = ["http://localhost:5173", "http://localhost:4173", "https://elmoluk.vercel.app"];
if (process.env.CORS_ORIGIN) allowedOrigins.push(process.env.CORS_ORIGIN);
app.use(cors({ origin: allowedOrigins, credentials: true }));

app.post("/api/debug/echo", async (c) => {
  const text = await c.req.text();
  console.log("DEBUG BODY:", text);
  return c.json({ received: text });
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
