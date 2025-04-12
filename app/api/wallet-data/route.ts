import { NextResponse } from "next/server";

let liteDb: any = null;

// Define network-specific external API URLs for wallet data
const EXTERNAL_API_URLS = {
  sepolia: "https://api-dashboard.a-pl.xyz:8080/wallet-data/",
  saga: "http://15.164.143.220/wallet-data/",
};

const USE_EXTERNAL_API = true;

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
    const network = searchParams.get("network") || "sepolia";

    console.log("[wallet-data API] Request for wallet address:", address);
    console.log("[wallet-data API] Using network:", network);

    if (!address) {
      console.log("[wallet-data API] Error: Wallet address is required");
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    // If using external API, try to forward the request
    if (USE_EXTERNAL_API) {
      try {
        const externalApiUrl =
          EXTERNAL_API_URLS[network as keyof typeof EXTERNAL_API_URLS] ||
          EXTERNAL_API_URLS.sepolia;
        const url = new URL(externalApiUrl);
        url.searchParams.append("address", address);

        console.log(
          "[wallet-data API] Forwarding to external API:",
          url.toString()
        );

        const externalResponse = await fetch(url.toString(), {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const responseText = await externalResponse.text();
        console.log(
          "[wallet-data API] External API raw response:",
          responseText
        );

        if (!externalResponse.ok) {
          console.error(
            `[wallet-data API] External API error: ${externalResponse.status}`
          );
          console.log("[wallet-data API] Falling back to local database");
          // Fall back to local database if external API fails
        } else {
          try {
            const responseData = JSON.parse(responseText);
            console.log("[wallet-data API] External API successful response");
            return NextResponse.json(responseData);
          } catch (e) {
            console.error(
              "[wallet-data API] Failed to parse response as JSON:",
              e
            );
            // Fall back to local database
          }
        }
      } catch (apiError) {
        console.error(
          "[wallet-data API] Error forwarding to external API:",
          apiError
        );
        console.log("[wallet-data API] Falling back to local database");
        // Fall back to local database if external API call fails
      }
    }

    // Local database lookup (fallback)
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
      network: network,
    });
  } catch (error) {
    console.error("[wallet-data API] Error retrieving wallet data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
