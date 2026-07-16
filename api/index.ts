import { Hono } from "hono";
import { cors } from "hono/cors";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

let initPromise: Promise<any> | null = null;
let initError: string | null = null;

function ensureInit() {
  if (!initPromise) {
    initPromise = (async () => {
      try {
        const [router, ctx] = await Promise.all([
          import("../src/server/router.js"),
          import("../src/server/context.js"),
        ]);
        return { appRouter: router.appRouter, createContext: ctx.createContext };
      } catch (err: any) {
        initError = err?.message || String(err);
        initError += "\n" + (err?.stack || "");
        throw err;
      }
    })();
  }
  return initPromise;
}

const app = new Hono();

const allowedOrigins = ["http://localhost:5173", "http://localhost:4173", "https://elmoluk.vercel.app"];
if (process.env.CORS_ORIGIN) allowedOrigins.push(process.env.CORS_ORIGIN);
app.use(cors({ origin: allowedOrigins, credentials: true }));

app.use("/api/trpc/*", async (c) => {
  try {
    const { appRouter, createContext } = await ensureInit();
    return fetchRequestHandler({
      endpoint: "/api/trpc",
      req: c.req.raw,
      router: appRouter,
      createContext,
    });
  } catch (err: any) {
    return c.json({ error: "Initialization failed", details: initError || String(err) }, 500);
  }
});

app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;
