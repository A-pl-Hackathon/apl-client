import liteDb, { Wallet } from "./lite-db";

const EXAMPLE_WALLETS: Wallet[] = [
  {
    address: "0x1234567890123456789012345678901234567890",
    personalData: "This is a sample personal data for the first wallet.",
  },
  {
    address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    personalData: "This is a sample personal data for the second wallet.",
  },
  {
    address: "0x9876543210987654321098765432109876543210",
    personalData: "This is a sample personal data for the third wallet.",
  },
];

export async function seedDatabaseWithFakeData(): Promise<void> {
  try {
    const existingWallets = await liteDb.getAllWallets();

    if (existingWallets.length === 0) {
      console.log(
        "No wallets found in the database. Seeding with example data..."
      );

      for (const wallet of EXAMPLE_WALLETS) {
        await liteDb.upsertWallet(wallet);
      }

      console.log(
        `Seeded database with ${EXAMPLE_WALLETS.length} example wallets.`
      );
    } else {
      console.log(
        `Database already contains ${existingWallets.length} wallets. Skipping seeding.`
      );
    }
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
