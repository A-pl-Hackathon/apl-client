import { NextResponse } from "next/server";
import liteDb from "../../db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    const walletData = await liteDb.getWalletByAddress(address);

    if (!walletData) {
      return NextResponse.json(
        {
          message: "Wallet not found",
          personalData: "",
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      address: walletData.address,
      personalData: walletData.personalData,
    });
  } catch (error) {
    console.error("Error retrieving wallet data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
