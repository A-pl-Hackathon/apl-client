import { NextRequest, NextResponse } from "next/server";

// Define module variables outside function scope
let liteDb: any = null;
let seedDatabaseWithFakeData: any = null;

// Immediately load modules on server-side
if (typeof window === "undefined") {
  import("@/app/db/lite-db").then((module) => {
    liteDb = module.default;
  });
  import("@/app/db/seed-data").then((module) => {
    seedDatabaseWithFakeData = module.seedDatabaseWithFakeData;
  });
}

export async function GET() {
  try {
    // Ensure modules are loaded
    if (!liteDb || !seedDatabaseWithFakeData) {
      console.log("Loading database modules...");
      const liteDbModule = await import("@/app/db/lite-db");
      liteDb = liteDbModule.default;

      const seedModule = await import("@/app/db/seed-data");
      seedDatabaseWithFakeData = seedModule.seedDatabaseWithFakeData;
    }

    // Seed the database
    await seedDatabaseWithFakeData();

    // Get all wallets - note the await for IndexedDB operations
    const wallets = await liteDb.getAllWallets();

    console.log(`Retrieved ${wallets.length} wallets from database`);

    return NextResponse.json({
      success: true,
      data: wallets,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Database query error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error.message || "An error occurred while querying the database.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!liteDb) {
      const liteDbModule = await import("@/app/db/lite-db");
      liteDb = liteDbModule.default;
    }

    const { address, personalData } = await request.json();

    if (!address) {
      return NextResponse.json(
        {
          success: false,
          error: "Wallet address is required.",
        },
        { status: 400 }
      );
    }

    const wallet = await liteDb.getWalletByAddress(address);

    if (!wallet && !personalData) {
      return NextResponse.json(
        {
          success: false,
          error: "Wallet not found and no personal data provided for creation.",
        },
        { status: 404 }
      );
    }

    // Update or create wallet
    const updatedWallet = await liteDb.upsertWallet({
      address,
      personalData: personalData || (wallet ? wallet.personalData : ""),
    });

    return NextResponse.json({
      success: true,
      wallet: updatedWallet,
      message: wallet
        ? "Wallet updated successfully"
        : "Wallet created successfully",
    });
  } catch (error: any) {
    console.error("Wallet update error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "An error occurred while updating the wallet.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!liteDb) {
      const liteDbModule = await import("@/app/db/lite-db");
      liteDb = liteDbModule.default;
    }

    const { address } = await request.json();

    if (!address) {
      return NextResponse.json(
        {
          success: false,
          error: "Wallet address is required.",
        },
        { status: 400 }
      );
    }

    const success = await liteDb.deleteWallet(address);

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: "Wallet not found or deletion failed.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Wallet deleted successfully",
    });
  } catch (error: any) {
    console.error("Wallet deletion error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "An error occurred while deleting the wallet.",
      },
      { status: 500 }
    );
  }
}
