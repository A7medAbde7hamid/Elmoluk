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
  const url = new URL(c.req.url);
  const method = c.req.method;

  const headers = new Headers(c.req.raw.headers as HeadersInit);

  const body: string | undefined = method === "GET" || method === "HEAD" ? undefined : await c.req.text();
  const req = new Request(url, { method, headers, body });

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
  });
});

app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;
