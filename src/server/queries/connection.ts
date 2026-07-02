import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { URL } from "url";
import { env } from "../lib/env.js";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

const fullSchema = { ...schema, ...relations };

function createPool() {
  const opts: mysql.PoolOptions = { uri: env.databaseUrl, waitForConnections: true, connectionLimit: 5 };

  if (env.databaseCa) {
    opts.ssl = { ca: env.databaseCa };
  }

  const parsed = new URL(env.databaseUrl);
  if (parsed.searchParams.has("ssl")) {
    try {
      const sslFromUrl = JSON.parse(parsed.searchParams.get("ssl")!);
      opts.ssl = typeof opts.ssl === "object" && opts.ssl !== null
        ? { ...opts.ssl, ...sslFromUrl }
        : sslFromUrl;
    } catch { /* ignore invalid JSON */ }
  }

  return mysql.createPool(opts);
}

let instance: ReturnType<typeof drizzle<typeof fullSchema>>;

export function getDb() {
  if (!instance) {
    const pool = createPool();
    instance = drizzle(pool as any, { mode: 'default', schema: fullSchema });
  }
  return instance;
}
