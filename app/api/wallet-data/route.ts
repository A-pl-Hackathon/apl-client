import { NextResponse } from "next/server";

let liteDb: any = null;

if (typeof window === "undefined") {
  import("@/app/db/lite-db").then((module) => {
    liteDb = module.default;
  });
}

export async function GET(request: Request) {
  try {
    if (!liteDb) {
      console.log("[wallet-data API] Loading database module...");
      const liteDbModule = await import("@/app/db/lite-db");
      liteDb = liteDbModule.default;
    }

    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");
    console.log("[wallet-data API] Request for wallet address:", address);

    if (!address) {
      console.log("[wallet-data API] Error: Wallet address is required");
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    console.log(`[wallet-data API] Searching database for address: ${address}`);
    console.log(
      `[wallet-data API] Address type: ${typeof address}, length: ${
        address.length
      }`
    );
    const walletData = await liteDb.getWalletByAddress(address);
    console.log(
      "[wallet-data API] Database lookup result:",
      walletData ? "Found" : "Not found"
    );

    if (!walletData) {
      console.log("[wallet-data API] Wallet not found in database");
      return NextResponse.json(
        {
          message: "Wallet not found",
          personalData: "",
        },
        { status: 200 }
      );
    }

    console.log("[wallet-data API] Wallet found. Address:", walletData.address);
    console.log("[wallet-data API] PersonalData:", walletData.personalData);
    console.log(
      "[wallet-data API] PersonalData type:",
      typeof walletData.personalData
    );

    return NextResponse.json({
      address: walletData.address,
      personalData: walletData.personalData,
    });
  } catch (error) {
    console.error("[wallet-data API] Error retrieving wallet data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
