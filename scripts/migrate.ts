import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("DATABASE_URL is not set — skipping database setup.");
    return;
  }
  await migrate(drizzle(neon(url)), { migrationsFolder: "./drizzle" });
  console.log("Database migrations applied.");
}

main().catch((err) => {
  console.error("Database migration failed:", err);
  process.exit(1);
});
