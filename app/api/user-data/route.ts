import { NextRequest, NextResponse } from "next/server";
import { liteDb } from "../../db";

const USE_EXTERNAL_API = true;

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

const EXTERNAL_API_URLS = {
  sepolia: "https://api-dashboard.a-pl.xyz:8080/user-data/",
  saga: "http://15.164.143.220/user-data/",
};

function corsResponse(data: any, status: number = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function OPTIONS() {
  return corsResponse({}, 200);
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    console.log("Received data:", JSON.stringify(data));

    if (!data.personalData || !data.personalData.walletAddress) {
      console.error("Missing required fields:", data);
      return corsResponse({ error: "Missing required fields" }, 400);
    }

    if (USE_EXTERNAL_API) {
      try {
        // Determine which API URL to use based on network
        const network = data.network || "sepolia";
        const externalApiUrl =
          EXTERNAL_API_URLS[network as keyof typeof EXTERNAL_API_URLS] ||
          EXTERNAL_API_URLS.sepolia;

        console.log(`Using network: ${network}`);
        console.log("Forwarding to external API:", externalApiUrl);
        console.log("Payload:", JSON.stringify(data));
        console.log("BACKEND_URL environment variable:", BACKEND_URL);

        const modifiedData = {
          ...data,
          backendUrl: BACKEND_URL,
        };

        const externalResponse = await fetch(externalApiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(modifiedData),
        });

        const responseText = await externalResponse.text();
        console.log("External API raw response:", responseText);

        if (!externalResponse.ok) {
          console.error(`External API error: ${externalResponse.status}`);
          console.error("Response details:", responseText);
          return corsResponse(
            {
              error: `External API returned ${externalResponse.status}`,
              details: responseText,
            },
            externalResponse.status
          );
        }

        let responseData;
        try {
          responseData = JSON.parse(responseText);
        } catch (e) {
          console.error("Failed to parse response as JSON:", e);
          responseData = { text: responseText };
        }

        return corsResponse(responseData);
      } catch (apiError: any) {
        console.error("Error forwarding to external API:", apiError);
        return corsResponse(
          {
            error: "Failed to connect to external API",
            details: apiError?.message || String(apiError),
          },
          502
        );
      }
    }

    const { walletAddress } = data.personalData;
    const agentModel = data.agentModel || "gpt-3.5-turbo";

    const personalDataStr = JSON.stringify(data.personalData);

    try {
      await liteDb.upsertWallet({
        address: walletAddress,
        personalData: personalDataStr,
      });
      console.log(`Data saved to local database for wallet: ${walletAddress}`);
    } catch (dbError) {
      console.error("Failed to save data to database:", dbError);
      return corsResponse({ error: "Failed to save data to database" }, 500);
    }

    return corsResponse({
      success: true,
      message: "User data saved successfully",
      walletAddress,
      agentModel,
    });
  } catch (error: any) {
    console.error("Error saving user data:", error);
    return corsResponse(
      {
        error: "Failed to save user data",
        details: error?.message || String(error),
      },
      500
    );
  }
}

export async function GET(request: NextRequest) {
  if (USE_EXTERNAL_API) {
    try {
      const { searchParams } = request.nextUrl;
      const network = searchParams.get("network") || "sepolia";
      const externalApiUrl =
        EXTERNAL_API_URLS[network as keyof typeof EXTERNAL_API_URLS] ||
        EXTERNAL_API_URLS.sepolia;

      const url = new URL(externalApiUrl);

      searchParams.forEach((value, key) => {
        url.searchParams.append(key, value);
      });

      console.log(`Using network: ${network}`);
      console.log("Forwarding GET to external API:", url.toString());

      const externalResponse = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const responseText = await externalResponse.text();
      console.log("External API raw GET response:", responseText);

      if (!externalResponse.ok) {
        return corsResponse(
          {
            error: `External API returned ${externalResponse.status}`,
            details: responseText,
          },
          externalResponse.status
        );
      }

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse GET response as JSON:", e);
        responseData = { text: responseText };
      }

      return corsResponse(responseData);
    } catch (apiError: any) {
      console.error("Error forwarding GET to external API:", apiError);
      return corsResponse(
        {
          error: "Failed to connect to external API",
          details: apiError?.message || String(apiError),
        },
        502
      );
    }
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const walletAddress = searchParams.get("walletAddress");

    if (!walletAddress) {
      return corsResponse({ error: "Wallet address is required" }, 400);
    }

    const walletData = await liteDb.getWalletByAddress(walletAddress);

    if (!walletData) {
      return corsResponse({ error: "Wallet not found" }, 404);
    }

    return corsResponse({
      success: true,
      walletAddress,
      personalData: walletData.personalData,
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    return corsResponse({ error: "Failed to fetch user data" }, 500);
  }
}
