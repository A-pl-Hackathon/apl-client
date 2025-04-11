import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const wallets = sqliteTable("wallets", {
  address: text("address").primaryKey(),
  personalData: text("personal_data").notNull(),
});
