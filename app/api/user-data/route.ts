import { NextRequest, NextResponse } from "next/server";
import { liteDb } from "../../db";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    if (!data.personalData || !data.personalData.walletAddress) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { walletAddress, data: personalData } = data.personalData;
    const agentModel = data.agentModel || "gpt-3.5-turbo";

    try {
      await liteDb.upsertWallet({
        address: walletAddress,
        personalData,
      });
      console.log(`Data saved to local database for wallet: ${walletAddress}`);
    } catch (dbError) {
      console.error("Failed to save data to database:", dbError);
      return NextResponse.json(
        { error: "Failed to save data to database" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "User data saved successfully",
        walletAddress,
        agentModel,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error saving user data:", error);
    return NextResponse.json(
      { error: "Failed to save user data" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const walletAddress = searchParams.get("walletAddress");

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    const walletData = await liteDb.getWalletByAddress(walletAddress);

    if (!walletData) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        walletAddress,
        personalData: walletData.personalData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json(
      { error: "Failed to fetch user data" },
      { status: 500 }
    );
  }
}
