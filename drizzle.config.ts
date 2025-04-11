import type { Config } from "drizzle-kit";

export default {
  schema: "./app/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: "./sqlite.db",
  },
} satisfies Config;
