import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { publicKey, secretKey, apiKey, personalData } = body;

    if (!publicKey || !secretKey || !apiKey) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("Received keys:", {
      publicKey,
      secretKeyLength: secretKey.length,
      apiKeyLength: apiKey.length,
      personalData: personalData
        ? {
            walletAddress: personalData.walletAddress,
            dataLength: personalData.data ? personalData.data.length : 0,
          }
        : null,
    });

    return NextResponse.json({
      success: true,
      message: "Data received successfully",
      data: {
        timestamp: new Date().toISOString(),
        status: "processed",
      },
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
