import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Connection string from environment
const connectionString = process.env.DATABASE_URL!;

// Auto-switch to Transaction Pooler (port 6543) for Supabase if using Session Pooler (port 5432)
// This prevents "MaxClientsInSessionMode" errors in serverless/dev environments
const poolConnectionString = connectionString?.includes("pooler.supabase.com")
  ? connectionString.replace(":5432", ":6543")
  : connectionString;

// For query purposes (serverless-friendly)
const client = postgres(poolConnectionString, { prepare: false, max: 10 });

// Drizzle instance with schema for relational queries
export const db = drizzle(client, { schema });

// Export schema for convenience
export * from "./schema";

