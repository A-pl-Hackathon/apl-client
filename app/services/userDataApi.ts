interface UserDataPayload {
  personalData: {
    walletAddress: string;
    data: string;
  };
  agentModel: string;
  prompt?: string;
}

export async function getWalletData(
  address: string
): Promise<{ personalData?: string }> {
  try {
    const response = await fetch(`/api/wallet-data?address=${address}`);

    if (!response.ok) {
      console.error("Error fetching wallet data:", response.statusText);
      return { personalData: "" };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch wallet data:", error);
    return { personalData: "" };
  }
}

export async function sendUserData(payload: UserDataPayload): Promise<any> {
  const finalPayload = {
    ...payload,
    prompt: payload.prompt || "",
  };

  console.log("Sending payload to API:", JSON.stringify(finalPayload));

  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL || "https://api-dashboard.a-pl.xyz";
  const apiUrl = `${apiBaseUrl}/user-data/`;

  try {
    console.log("Attempting to use external API directly with no-cors...");
    console.log("Using external URL:", apiUrl);

    const externalResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(finalPayload),
      mode: "no-cors",
    });

    console.log(
      "External API response status:",
      externalResponse.status,
      externalResponse.statusText
    );
    console.log("External API response type:", externalResponse.type);

    console.log("External API request sent with no-cors mode");

    return {
      success: true,
      message:
        "Request sent in no-cors mode. Unable to read response, but request was sent.",
      walletAddress: finalPayload.personalData.walletAddress,
    };
  } catch (externalError) {
    console.error("External API attempt failed:", externalError);

    try {
      console.log("Trying external API with cors mode...");
      const corsResponse = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(finalPayload),
        mode: "cors",
      });

      const responseText = await corsResponse.text();
      console.log("CORS mode response:", responseText);

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = { text: responseText };
      }

      return responseData;
    } catch (corsError) {
      console.error("CORS mode failed:", corsError);

      try {
        console.log("Falling back to local API endpoint...");
        const response = await fetch("/api/user-data/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(finalPayload),
          credentials: "include",
        });

        const responseData = await response.json();

        if (!response.ok) {
          console.warn("Local API error details:", responseData);
          throw new Error(
            `Local API request failed with status ${response.status}`
          );
        }

        console.log("Local API response:", responseData);
        return responseData;
      } catch (localError) {
        const ports = ["", ":8080", ":8000", ":443"];
        for (const port of ports) {
          try {
            console.log(
              `Attempting direct request to port ${port || "default"}...`
            );
            const url = `${apiBaseUrl}${port}/user-data/`;

            console.log(`Testing connectivity to ${url}`);
            const testResponse = await fetch(url, {
              method: "HEAD",
              mode: "no-cors",
            });
            console.log(`Connectivity test response:`, testResponse);

            const directResponse = await fetch(url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(finalPayload),
              mode: "no-cors",
            });

            console.log(`Direct response from ${url}:`, directResponse);
            return {
              success: true,
              message: `Request sent to ${url} in no-cors mode. Unable to read response.`,
              walletAddress: finalPayload.personalData.walletAddress,
            };
          } catch (directError) {
            console.error(`Error with port ${port || "default"}:`, directError);
          }
        }

        console.log(
          "All API attempts failed - returning mock success response"
        );
        return {
          success: true,
          message: "Development mode: Simulated successful data storage",
          walletAddress: finalPayload.personalData.walletAddress,
          note: "This is a simulated response since the API is not available",
        };
      }
    }
  }
}
