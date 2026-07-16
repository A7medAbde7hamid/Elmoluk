import { env } from "../src/server/lib/env.js";
import { Hono } from "hono";

const app = new Hono();

app.get("/api/trpc/ping", (c) => c.json({ pong: true, envKeys: Object.keys(env), dbUrl: !!env.databaseUrl }));
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;
