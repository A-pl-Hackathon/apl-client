import liteDb, { Wallet } from "./lite-db";

let isInitialized = false;

export async function seedDatabaseWithFakeData() {
  if (typeof window !== "undefined") {
    console.warn(
      "seedDatabaseWithFakeData can only be executed on the server side."
    );
    return;
  }

  if (isInitialized) {
    console.log("Database has already been initialized.");
    return;
  }

  const existingWallets = liteDb.getAllWallets();
  if (existingWallets.length > 0) {
    console.log(
      `Database already has ${existingWallets.length} wallets. Skipping seed operation.`
    );
    isInitialized = true;
    return;
  }

  try {
    console.log("Adding test data to the database...");

    const wallets: Wallet[] = [
      {
        address: "0x1234567890123456789012345678901234567890",
        personalData:
          "The quick brown fox jumps over the lazy dog. Alice enjoys reading novels and hiking on weekends. Her favorite color is blue and she has a pet cat named Whiskers.",
      },
      {
        address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        personalData:
          "Bob is a software engineer who loves coffee and playing chess. He travels frequently and has visited over 20 countries. His dream is to start his own tech company someday.",
      },
      {
        address: "0x9876543210987654321098765432109876543210",
        personalData:
          "Charlie works in finance and collects vintage watches. He runs marathons twice a year and follows a strict diet. He speaks three languages fluently and is learning a fourth.",
      },
      {
        address: "0xfedcbafedcbafedcbafedcbafedcbafedcbafedcba",
        personalData:
          "Diana is a graphic designer with a passion for street photography. She's lived in five different cities and enjoys trying new cuisines. She volunteers at an animal shelter on Sundays.",
      },
      {
        address: "0xa1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
        personalData:
          "Edward teaches history at a university and collects rare books. He plays the piano and has performed in small concerts. His favorite historical period is the Renaissance.",
      },
    ];

    for (const wallet of wallets) {
      liteDb.upsertWallet(wallet);
    }

    console.log("Test data has been added successfully!");
    isInitialized = true;
  } catch (error) {
    console.error("Error while seeding database:", error);
    throw error;
  }
}
