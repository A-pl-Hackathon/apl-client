export interface Wallet {
  address: string;
  personalData: string;
}

export function formatDateKST() {
  const now = new Date();
  now.setHours(now.getHours() + 9); // KST is UTC+9
  return now.toISOString().replace("T", " ").substring(0, 19);
}

type SqlJsDb = any;
type SqlJsStatic = any;

let isDbInitialized = false;
let walletsCache: Wallet[] = [];

class LiteDatabase {
  private db: SqlJsDb | null = null;
  private SQL: SqlJsStatic | null = null;
  private isInitializing = false;

  constructor() {
    this.initializeDatabase();
  }

  private async initializeDatabase() {
    if (this.isInitializing || isDbInitialized) return;
    this.isInitializing = true;

    try {
      const initSqlJs = (await import("sql.js")).default;
      this.SQL = await initSqlJs();

      this.db = new this.SQL.Database();

      this.createTables();

      isDbInitialized = true;
      console.log("SQL.js database initialization completed");

      if (walletsCache.length > 0) {
        this.migrateFromCache();
      }
    } catch (error) {
      console.error("SQL.js database initialization error:", error);
    } finally {
      this.isInitializing = false;
    }
  }

  private createTables() {
    if (!this.db) return;

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS wallets (
        address TEXT PRIMARY KEY,
        personalData TEXT NOT NULL
      );
    `);
  }

  private migrateFromCache() {
    for (const wallet of walletsCache) {
      this.upsertWallet(wallet);
    }
    walletsCache = [];
  }

  getAllWallets(): Wallet[] {
    if (!this.db || !isDbInitialized) return walletsCache;

    try {
      const result = this.db.exec("SELECT * FROM wallets");
      if (result.length === 0) return [];

      return result[0].values.map((row: any[]) => ({
        address: row[0] as string,
        personalData: row[1] as string,
      }));
    } catch (error) {
      console.error("Wallet retrieval error:", error);
      return walletsCache;
    }
  }

  getWalletByAddress(address: string): Wallet | null {
    if (!this.db || !isDbInitialized) {
      return walletsCache.find((wallet) => wallet.address === address) || null;
    }

    try {
      const stmt = this.db.prepare(
        "SELECT * FROM wallets WHERE address = :address"
      );
      stmt.bind({ ":address": address });

      if (!stmt.step()) {
        stmt.free();
        return null;
      }

      const row = stmt.getAsObject();
      stmt.free();

      return {
        address: row.address as string,
        personalData: row.personalData as string,
      };
    } catch (error) {
      console.error(`Wallet retrieval error for address ${address}:`, error);
      return null;
    }
  }

  upsertWallet(wallet: Wallet): Wallet {
    if (!this.db || !isDbInitialized) {
      const existingIndex = walletsCache.findIndex(
        (w) => w.address === wallet.address
      );
      if (existingIndex >= 0) {
        walletsCache[existingIndex] = wallet;
      } else {
        walletsCache.push(wallet);
      }
      return wallet;
    }

    try {
      const stmt = this.db.prepare(
        "INSERT OR REPLACE INTO wallets (address, personalData) VALUES (:address, :personalData)"
      );
      stmt.bind({
        ":address": wallet.address,
        ":personalData": wallet.personalData,
      });

      stmt.step();
      stmt.free();

      return wallet;
    } catch (error) {
      console.error("Wallet upsert error:", error);
      throw error;
    }
  }

  deleteWallet(address: string): boolean {
    if (!this.db || !isDbInitialized) {
      const initialLength = walletsCache.length;
      walletsCache = walletsCache.filter(
        (wallet) => wallet.address !== address
      );
      return walletsCache.length < initialLength;
    }

    try {
      const stmt = this.db.prepare(
        "DELETE FROM wallets WHERE address = :address"
      );
      stmt.bind({ ":address": address });
      stmt.step();
      stmt.free();

      return true;
    } catch (error) {
      console.error(`Wallet deletion error for address ${address}:`, error);
      return false;
    }
  }

  exportDatabase(): Uint8Array | null {
    if (!this.db) return null;
    try {
      return this.db.export();
    } catch (error) {
      console.error("Database export error:", error);
      return null;
    }
  }
}

const liteDb = new LiteDatabase();
export default liteDb;
