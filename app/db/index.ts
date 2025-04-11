import liteDb, { Wallet } from "./lite-db";
import { seedDatabaseWithFakeData } from "./seed-data";

export { liteDb, seedDatabaseWithFakeData };

export type { Wallet };

if (typeof window === "undefined") {
  seedDatabaseWithFakeData()
    .then(() => {
      console.log("Database has been initialized with seed data (if needed).");
    })
    .catch((error) => {
      console.error("Error initializing database:", error);
    });
}

export async function exportDatabase(): Promise<Uint8Array | null> {
  return liteDb.exportDatabase();
}

export default liteDb;
