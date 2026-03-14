#!/usr/bin/env node
/**
 * Run Onvest schema migration (002) using DATABASE_URL from .env.
 * Usage: node scripts/run-onvest-migrate.mjs (from repo root)
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import pg from "pg";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
dotenv.config({ path: join(root, ".env") });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set in .env");
  process.exit(1);
}

const sqlPath = join(root, "packages/db/supabase/migrations/002_onvest_schema.sql");
const sql = readFileSync(sqlPath, "utf8");

const client = new pg.Client({ connectionString: url });
try {
  await client.connect();
  await client.query(sql);
  console.log("Migration 002_onvest_schema.sql completed. Tables created in Onvest schema.");
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
