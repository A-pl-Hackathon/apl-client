import { NextRequest, NextResponse } from "next/server";

const USE_EXTERNAL_API = true;
const EXTERNAL_API_URLS = {
  sepolia: "https://api-dashboard.a-pl.xyz:8080/confirm-delegation/",
  saga: "http://15.164.143.220/confirm-delegation/",
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
    console.log("Received delegation confirmation data:", JSON.stringify(data));

    if (!data.request_id) {
      console.error("Missing request_id field:", data);
      return corsResponse({ error: "Missing request_id field" }, 400);
    }

    if (typeof data.confirmed !== "boolean") {
      console.error("Missing or invalid confirmed field:", data);
      return corsResponse({ error: "Missing or invalid confirmed field" }, 400);
    }

    const network = data.network || "sepolia";
    console.log(`Using network: ${network}`);

    if (USE_EXTERNAL_API) {
      try {
        const externalApiUrl =
          EXTERNAL_API_URLS[network as keyof typeof EXTERNAL_API_URLS] ||
          EXTERNAL_API_URLS.sepolia;
        console.log("Forwarding to external confirmation API:", externalApiUrl);
        console.log("Payload:", JSON.stringify(data));

        const externalResponse = await fetch(externalApiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            request_id: data.request_id,
            confirmed: data.confirmed,
          }),
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

    return corsResponse({
      success: true,
      message: data.confirmed
        ? "Delegation confirmed successfully"
        : "Delegation was declined by the user",
      request_id: data.request_id,
      confirmed: data.confirmed,
      network: network,
    });
  } catch (error: any) {
    console.error("Error processing delegation confirmation:", error);
    return corsResponse(
      {
        error: "Failed to process delegation confirmation",
        details: error?.message || String(error),
      },
      500
    );
  }
}
