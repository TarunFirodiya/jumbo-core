import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Connection string from environment
const connectionString = process.env.DATABASE_URL!;

// For query purposes (serverless-friendly)
const client = postgres(connectionString, { prepare: false });

// Drizzle instance with schema for relational queries
export const db = drizzle(client, { schema });

// Export schema for convenience
export * from "./schema";

