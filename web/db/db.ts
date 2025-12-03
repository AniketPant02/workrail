import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/db/schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

type DrizzleDB = NodePgDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  pool: Pool | undefined;
  db: DrizzleDB | undefined;
};

const pool = globalForDb.pool ?? new Pool({ connectionString });
const db = globalForDb.db ?? drizzle(pool, { schema });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
  globalForDb.db = db;
}

export { db };
