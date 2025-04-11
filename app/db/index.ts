import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const dbPath =
  process.env.NODE_ENV === "production"
    ? path.join("/data", "sqlite.db")
    : path.join(process.cwd(), "sqlite.db");

if (process.env.NODE_ENV === "production") {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const sqlite = new Database(dbPath);

export const db = drizzle(sqlite, { schema });

export function formatDateKST() {
  const kstOffset = 9 * 60; // KST is UTC+9
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const kstTime = new Date(utc + kstOffset * 60000);

  return kstTime.toISOString().replace("T", " ").substring(0, 19);
}
