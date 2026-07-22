import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { URL } from "url";
import { env } from "../lib/env.js";
import * as schema from "../../../db/schema.js";
import * as relations from "../../../db/relations.js";

const fullSchema = { ...schema, ...relations };

function createPool() {
  const opts: mysql.PoolOptions = {
    uri: env.databaseUrl,
    waitForConnections: true,
    connectionLimit: 5,
    ssl: { rejectUnauthorized: true },
  };

  if (env.databaseCa) {
    opts.ssl = { ca: env.databaseCa };
  }

  return mysql.createPool(opts);
}

let pool: mysql.Pool;
let instance: any;

export function getPool() {
  if (!pool) pool = createPool();
  return pool;
}

export function getDb() {
  if (!instance) {
    instance = drizzle(getPool(), { mode: "default", schema: fullSchema });
  }
  return instance;
}
