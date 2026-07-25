import { Hono } from "hono";
import { cors } from "hono/cors";
import { randomUUID } from "crypto";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../src/server/router.js";
import { createContext } from "../src/server/context.js";

const app = new Hono();

app.use("*", async (c, next) => {
  const start = Date.now();
  const requestId = randomUUID().slice(0, 8);
  c.set("requestId", requestId);
  c.header("X-Request-Id", requestId);
  await next();
  const ms = Date.now() - start;
  const status = c.res.status;
  if (status >= 500) {
    console.error(
      `[MONITOR] [${requestId}] ${c.req.method} ${c.req.path} ${status} ${ms}ms`
    );
  } else if (ms > 5000) {
    console.warn(
      `[MONITOR] [${requestId}] Slow: ${c.req.method} ${c.req.path} ${status} ${ms}ms`
    );
  }
});

// Body size limit: 5MB for API endpoints (prevents memory exhaustion)
app.use("/api/*", async (c, next) => {
  if (c.req.method === "GET" || c.req.method === "HEAD") return next();
  const contentLength = Number(c.req.header("content-length") || 0);
  if (contentLength > 5 * 1024 * 1024) {
    return c.json({ error: "Payload Too Large" }, 413);
  }
  return next();
});

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",
  "https://elmoluk.vercel.app",
];
if (process.env.CORS_ORIGIN) allowedOrigins.push(process.env.CORS_ORIGIN);
app.use(cors({ origin: allowedOrigins, credentials: true }));

app.get("/sitemap.xml", c => {
  const BASE_URL = "https://elmoluk.vercel.app";
  const pages = [
    { loc: "/", priority: "1.0", changefreq: "weekly" },
    { loc: "/services", priority: "0.9", changefreq: "monthly" },
    { loc: "/barbers", priority: "0.8", changefreq: "monthly" },
    { loc: "/packages", priority: "0.8", changefreq: "monthly" },
    { loc: "/booking", priority: "0.9", changefreq: "weekly" },
    { loc: "/shop", priority: "0.7", changefreq: "weekly" },
    { loc: "/offers", priority: "0.7", changefreq: "weekly" },
    { loc: "/contact", priority: "0.6", changefreq: "monthly" },
    { loc: "/login", priority: "0.3", changefreq: "monthly" },
  ];
  const urls = pages
    .map(
      p =>
        `  <url>\n    <loc>${BASE_URL}${p.loc}</loc>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`
    )
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
  return c.newResponse(xml, 200, {
    "Content-Type": "application/xml; charset=utf-8",
    "Cache-Control": "public, max-age=3600, s-maxage=3600",
  });
});

app.use("/api/trpc/*", async c => {
  const url = new URL(c.req.url);
  const method = c.req.method;

  const headers = new Headers(c.req.raw.headers as HeadersInit);
  const requestId = c.get("requestId");
  if (requestId) headers.set("X-Request-Id", requestId);

  const body: string | undefined =
    method === "GET" || method === "HEAD" ? undefined : await c.req.text();
  const req = new Request(url, { method, headers, body });

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
  });
});

app.get("/api/health", async c => {
  const health: {
    status: string;
    timestamp: string;
    uptime: number;
    memory: { rss: string; heap: string };
    database?: string;
    env?: string;
  } = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    memory: {
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + "MB",
      heap: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + "MB",
    },
    env: process.env.VERCEL ? "production" : "development",
  };

  try {
    const { getDb } = await import("../src/server/queries/connection.js");
    const db = getDb();
    await db.execute("SELECT 1");
    health.database = "ok";
  } catch {
    health.database = "error";
    health.status = "degraded";
  }

  const statusCode = health.status === "ok" ? 200 : 503;
  return c.json(health, statusCode);
});

app.all("/api/*", c => c.json({ error: "Not Found" }, 404));

export default app;
