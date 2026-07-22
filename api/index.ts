import { Hono } from "hono";
import { cors } from "hono/cors";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../src/server/router.js";
import { createContext } from "../src/server/context.js";

const app = new Hono();

const allowedOrigins = ["http://localhost:5173", "http://localhost:4173", "https://elmoluk.vercel.app"];
if (process.env.CORS_ORIGIN) allowedOrigins.push(process.env.CORS_ORIGIN);
app.use(cors({ origin: allowedOrigins, credentials: true }));

app.get("/sitemap.xml", (c) => {
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
  const urls = pages.map((p) => `  <url>\n    <loc>${BASE_URL}${p.loc}</loc>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
  return c.newResponse(xml, 200, { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=3600" });
});

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
