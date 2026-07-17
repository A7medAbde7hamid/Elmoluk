import { Hono } from "hono";
import { cors } from "hono/cors";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../src/server/router.js";
import { createContext } from "../src/server/context.js";

const app = new Hono();

const allowedOrigins = ["http://localhost:5173", "http://localhost:4173", "https://elmoluk.vercel.app"];
if (process.env.CORS_ORIGIN) allowedOrigins.push(process.env.CORS_ORIGIN);
app.use(cors({ origin: allowedOrigins, credentials: true }));

app.get("/api/trpc/debug", async (c) => c.json({ ok: true, message: "GET works" }));

app.post("/api/trpc/debug", async (c) => {
  const contentType = c.req.header("content-type") || "none";
  let bodyText = "unable to read";
  try {
    bodyText = await c.req.raw.clone().text();
  } catch (e: any) {
    bodyText = "error: " + e.message;
  }
  return c.json({
    contentType,
    bodyLength: bodyText.length,
    bodyPreview: bodyText.substring(0, 500),
  });
});

app.get("/api/trpc/dbcheck", async (c) => {
  try {
    const { getDb } = await import("../src/server/queries/connection.js");
    const db = getDb();
    const rawSql = db.$client;
    const [rows] = await rawSql.execute("SHOW TABLES");
    const tables = (rows as any[]).map((r: any) => Object.values(r)[0]);
    return c.json({ ok: true, tables });
  } catch (e: any) {
    return c.json({ ok: false, error: e.message, stack: e.stack?.split("\n").slice(0, 5).join("\n") }, 500);
  }
});

app.use("/api/trpc/*", async (c) => {
  const url = c.req.url;
  const method = c.req.method;
  let bodyText = "";

  if (method === "POST") {
    bodyText = await c.req.raw.clone().text();
  }

  const req = method === "POST"
    ? new Request(c.req.raw.url, { method, headers: c.req.raw.headers, body: bodyText })
    : c.req.raw;

  let response;
  try {
    response = await fetchRequestHandler({
      endpoint: "/api/trpc",
      req,
      router: appRouter,
      createContext,
    });
  } catch (e: any) {
    return new Response(JSON.stringify({
      error: "tRPC handler threw",
      message: e.message,
      url,
      method,
      bodyLength: bodyText.length,
      bodyPreview: bodyText.substring(0, 800),
    }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  if (response.status >= 400 && method === "POST") {
    const cloned = response.clone();
    let responseBody = "unable to read";
    try {
      responseBody = await cloned.text();
    } catch { }
    let trpcError;
    try { trpcError = JSON.parse(responseBody); } catch { trpcError = responseBody; }
    return new Response(JSON.stringify({
      trpcError,
      url,
      method,
      bodyLength: bodyText.length,
      bodyPreview: bodyText.substring(0, 800),
    }), {
      status: response.status,
      headers: { "content-type": "application/json" },
    });
  }

  return response;
});

app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;
