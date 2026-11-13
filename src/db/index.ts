import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export type Database = NeonHttpDatabase<typeof schema>;

let instance: Database | undefined;

function create(): Database {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
  }
  return drizzle(neon(url), { schema });
}

/** Lazily-created client so `next build` never needs a live database. */
export const db: Database = new Proxy({} as Database, {
  get(_target, prop) {
    instance ??= create();
    const value = Reflect.get(instance, prop, instance) as unknown;
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export { schema };
