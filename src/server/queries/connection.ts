import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
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
    opts.ssl = { ca: env.databaseCa, rejectUnauthorized: true };
  }

  return mysql.createPool(opts);
}

let pool: mysql.Pool;
let instance: MySql2Database<typeof fullSchema> | undefined;

export function getPool() {
  if (!pool) pool = createPool();
  return pool;
}

export function getDb() {
  if (!instance) {
    instance = drizzle(getPool(), {
      mode: "default",
      schema: fullSchema,
    }) as MySql2Database<typeof fullSchema>;
  }
  return instance;
}
