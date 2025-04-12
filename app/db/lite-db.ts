export interface Wallet {
  address: string;
  personalData: string;
}

export function formatDateKST() {
  const now = new Date();
  now.setHours(now.getHours() + 9); // KST is UTC+9
  return now.toISOString().replace("T", " ").substring(0, 19);
}

// Memory cache for wallets
let walletsCache: Wallet[] = [];

class LiteDatabase {
  private dbName = "walletDB";
  private storeName = "wallets";
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor() {
    // Initialize only in browser environment
    if (typeof window !== "undefined") {
      this.initializeDatabase();
    }
  }

  private initializeDatabase(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === "undefined") {
        reject(new Error("IndexedDB is not available in this environment"));
        return;
      }

      try {
        const request = indexedDB.open(this.dbName, 1);

        request.onerror = (event) => {
          console.error("IndexedDB error:", event);
          reject(new Error("Failed to open IndexedDB"));
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;

          // Create object store for wallets
          if (!db.objectStoreNames.contains(this.storeName)) {
            const store = db.createObjectStore(this.storeName, {
              keyPath: "address",
            });
            store.createIndex("address", "address", { unique: true });
          }
        };
      } catch (error) {
        console.error("IndexedDB initialization error:", error);
        reject(error);
      }
    });

    return this.dbPromise;
  }

  async getAllWallets(): Promise<Wallet[]> {
    // For server-side rendering, return the cache
    if (typeof window === "undefined") {
      return walletsCache;
    }

    try {
      const db = await this.initializeDatabase();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, "readonly");
        const store = transaction.objectStore(this.storeName);
        const request = store.getAll();

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = (event) => {
          console.error("Error fetching wallets:", event);
          reject(new Error("Failed to fetch wallets"));
        };
      });
    } catch (error) {
      console.error("Error in getAllWallets:", error);
      return walletsCache;
    }
  }

  async getWalletByAddress(address: string): Promise<Wallet | null> {
    // For server-side rendering, return from cache
    if (typeof window === "undefined") {
      return walletsCache.find((wallet) => wallet.address === address) || null;
    }

    try {
      const db = await this.initializeDatabase();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, "readonly");
        const store = transaction.objectStore(this.storeName);
        const request = store.get(address);

        request.onsuccess = () => {
          resolve(request.result || null);
        };

        request.onerror = (event) => {
          console.error(`Error fetching wallet ${address}:`, event);
          reject(new Error(`Failed to fetch wallet ${address}`));
        };
      });
    } catch (error) {
      console.error(`Error in getWalletByAddress for ${address}:`, error);
      return walletsCache.find((wallet) => wallet.address === address) || null;
    }
  }

  async upsertWallet(wallet: Wallet): Promise<Wallet> {
    // Always update the cache
    const existingIndex = walletsCache.findIndex(
      (w) => w.address === wallet.address
    );
    if (existingIndex >= 0) {
      walletsCache[existingIndex] = wallet;
    } else {
      walletsCache.push(wallet);
    }

    // For server-side rendering, just update the cache
    if (typeof window === "undefined") {
      return wallet;
    }

    try {
      const db = await this.initializeDatabase();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, "readwrite");
        const store = transaction.objectStore(this.storeName);
        const request = store.put(wallet);

        request.onsuccess = () => {
          resolve(wallet);
        };

        request.onerror = (event) => {
          console.error(`Error upserting wallet ${wallet.address}:`, event);
          reject(new Error(`Failed to upsert wallet ${wallet.address}`));
        };
      });
    } catch (error) {
      console.error(`Error in upsertWallet for ${wallet.address}:`, error);
      return wallet; // Return the wallet even if IndexedDB fails
    }
  }

  async deleteWallet(address: string): Promise<boolean> {
    // Always update the cache
    const initialLength = walletsCache.length;
    walletsCache = walletsCache.filter((wallet) => wallet.address !== address);

    // For server-side rendering, just update the cache
    if (typeof window === "undefined") {
      return walletsCache.length < initialLength;
    }

    try {
      const db = await this.initializeDatabase();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, "readwrite");
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(address);

        request.onsuccess = () => {
          resolve(true);
        };

        request.onerror = (event) => {
          console.error(`Error deleting wallet ${address}:`, event);
          reject(new Error(`Failed to delete wallet ${address}`));
        };
      });
    } catch (error) {
      console.error(`Error in deleteWallet for ${address}:`, error);
      return walletsCache.length < initialLength;
    }
  }
}

const liteDb = new LiteDatabase();
export default liteDb;
