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
    console.log(`[lite-db] getWalletByAddress called with: "${address}"`);
    console.log(
      `[lite-db] Address type: ${typeof address}, length: ${address.length}`
    );

    if (!address) {
      console.log(`[lite-db] Error: Empty address provided`);
      return null;
    }

    const normalizedAddress = address.toLowerCase();
    console.log(`[lite-db] Normalized address: ${normalizedAddress}`);

    // For server-side rendering, return from cache
    if (typeof window === "undefined") {
      console.log(
        `[lite-db] Server-side rendering, searching in cache of ${walletsCache.length} wallets`
      );
      // 캐시에서 주소 로그 출력
      console.log(
        `[lite-db] Cache wallet addresses:`,
        walletsCache.map((w) => w.address)
      );

      // 대소문자 구분 없이 주소 비교
      const cachedWallet = walletsCache.find(
        (wallet) => wallet.address.toLowerCase() === normalizedAddress
      );
      console.log(`[lite-db] Cached wallet found:`, !!cachedWallet);
      if (cachedWallet) {
        console.log(
          `[lite-db] Cached wallet data:`,
          JSON.stringify(cachedWallet)
        );
        console.log(
          `[lite-db] Personal data type:`,
          typeof cachedWallet.personalData
        );
        console.log(`[lite-db] Personal data:`, cachedWallet.personalData);

        // 데이터가 JSON 형식인지 확인
        try {
          if (
            cachedWallet.personalData &&
            typeof cachedWallet.personalData === "string"
          ) {
            const parsed = JSON.parse(cachedWallet.personalData);
            console.log(`[lite-db] Parsed personal data:`, parsed);
          }
        } catch (e) {
          console.log(`[lite-db] Personal data is not JSON`);
        }
      }
      return cachedWallet || null;
    }

    try {
      console.log(`[lite-db] Browser environment, initializing database...`);
      const db = await this.initializeDatabase();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, "readonly");
        const store = transaction.objectStore(this.storeName);

        let request = store.get(address);

        request.onsuccess = () => {
          let result = request.result;

          if (!result) {
            console.log(
              `[lite-db] Exact address match not found, getting all wallets...`
            );
            const getAllRequest = store.getAll();

            getAllRequest.onsuccess = () => {
              const allWallets = getAllRequest.result || [];
              console.log(`[lite-db] Found ${allWallets.length} wallets in DB`);

              result = allWallets.find(
                (wallet) => wallet.address.toLowerCase() === normalizedAddress
              );

              finishRequest(result);
            };

            getAllRequest.onerror = (event) => {
              console.error(`[lite-db] Error fetching all wallets:`, event);
              finishRequest(null);
            };
          } else {
            finishRequest(result);
          }
        };

        function finishRequest(result: any) {
          console.log(
            `[lite-db] Database lookup result for "${address}":`,
            !!result
          );
          if (result) {
            console.log(
              `[lite-db] Wallet found with address: ${result.address}`
            );
            console.log(`[lite-db] Personal data:`, result.personalData);
            console.log(
              `[lite-db] Personal data type:`,
              typeof result.personalData
            );

            try {
              if (
                result.personalData &&
                typeof result.personalData === "string"
              ) {
                const parsed = JSON.parse(result.personalData);
                console.log(`[lite-db] Parsed personal data:`, parsed);
              }
            } catch (e) {
              console.log(`[lite-db] Personal data is not JSON`);
            }
          }
          resolve(result || null);
        }

        request.onerror = (event) => {
          console.error(`[lite-db] Error fetching wallet ${address}:`, event);
          reject(new Error(`Failed to fetch wallet ${address}`));
        };
      });
    } catch (error) {
      console.error(
        `[lite-db] Error in getWalletByAddress for ${address}:`,
        error
      );
      console.log(`[lite-db] Falling back to cache search`);
      const cachedWallet = walletsCache.find(
        (wallet) => wallet.address.toLowerCase() === normalizedAddress
      );
      console.log(`[lite-db] Fallback cached wallet found:`, !!cachedWallet);
      if (cachedWallet) {
        console.log(
          `[lite-db] Fallback wallet data:`,
          JSON.stringify(cachedWallet)
        );
      }
      return cachedWallet || null;
    }
  }

  async upsertWallet(wallet: Wallet): Promise<Wallet> {
    const existingIndex = walletsCache.findIndex(
      (w) => w.address === wallet.address
    );
    if (existingIndex >= 0) {
      walletsCache[existingIndex] = wallet;
    } else {
      walletsCache.push(wallet);
    }

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
