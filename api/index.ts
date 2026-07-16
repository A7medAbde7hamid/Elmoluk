import { Hono } from "hono";

const app = new Hono();

app.get("/api/trpc/ping", (c) => c.json({ pong: true, env: { APP_ID: !!process.env.APP_ID, DATABASE_URL: !!process.env.DATABASE_URL, NODE_ENV: process.env.NODE_ENV } }));
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;
