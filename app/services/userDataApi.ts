interface UserDataPayload {
  personalData: {
    walletAddress: string;
    data: string;
  };
  agentModel: string;
  prompt?: string;
  network?: "sepolia" | "saga";
}

interface DelegationConfirmationData {
  requestId: string;
  userWalletAddress: string;
  userTokenBalance: string;
  token: string;
  backendPublicAddress: string;
}

const getDefaultNetwork = (): "sepolia" | "saga" => {
  if (typeof window === "undefined") {
    return "sepolia";
  }

  try {
    const savedNetwork = localStorage.getItem("selectedNetwork");
    if (savedNetwork === "saga" || savedNetwork === "sepolia") {
      return savedNetwork as "sepolia" | "saga";
    }
  } catch (error) {
    console.error("[userDataApi] Error accessing localStorage:", error);
  }

  return "sepolia";
};

function truncateAddress(
  address: string,
  startChars: number = 6,
  endChars: number = 4
): string {
  if (!address || address.length <= startChars + endChars) {
    return address;
  }
  return `${address.substring(0, startChars)}...${address.substring(
    address.length - endChars
  )}`;
}

export async function getWalletData(
  address: string,
  network?: "sepolia" | "saga"
): Promise<{ personalData?: string }> {
  try {
    const effectiveNetwork = network || getDefaultNetwork();

    console.log(`[userDataApi] Fetching wallet data for address: ${address}`);
    console.log(`[userDataApi] Using network: ${effectiveNetwork}`);
    console.log(
      `[userDataApi] Address type: ${typeof address}, length: ${address.length}`
    );

    const url = `/api/wallet-data?address=${address}&network=${effectiveNetwork}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error(
        "[userDataApi] Error fetching wallet data:",
        response.statusText
      );
      return { personalData: "" };
    }

    const data = await response.json();
    console.log(
      "[userDataApi] Raw wallet data response:",
      JSON.stringify(data)
    );

    if (data && typeof data === "object") {
      let personalData =
        data.personalData || (data.data && data.data.personalData) || "";

      console.log("[userDataApi] Extracted personalData:", personalData);
      console.log("[userDataApi] personalData type:", typeof personalData);

      if (!personalData) {
        console.log("[userDataApi] Empty personalData, returning empty string");
        return { personalData: "" };
      }

      if (typeof personalData === "string" && personalData.trim()) {
        try {
          const parsedData = JSON.parse(personalData);
          console.log(
            "[userDataApi] Successfully parsed personalData JSON:",
            parsedData
          );

          return { personalData };
        } catch (e) {
          console.log("[userDataApi] Not a valid JSON string, using as is");
        }
      }

      return { personalData };
    }

    console.log("[userDataApi] No data found, returning empty personalData");
    return { personalData: "" };
  } catch (error) {
    console.error("[userDataApi] Failed to fetch wallet data:", error);
    return { personalData: "" };
  }
}

export async function sendUserData(payload: UserDataPayload): Promise<any> {
  const network = payload.network || getDefaultNetwork();

  const finalPayload = {
    ...payload,
    prompt: payload.prompt || "",
    network: network,
  };

  console.log(
    "[userDataApi] Sending payload to API:",
    JSON.stringify(finalPayload)
  );
  console.log(
    "[userDataApi] WalletAddress:",
    finalPayload.personalData.walletAddress
  );
  console.log("[userDataApi] Data to send:", finalPayload.personalData.data);
  console.log(
    "[userDataApi] Data type:",
    typeof finalPayload.personalData.data
  );
  console.log(
    "[userDataApi] Is data empty:",
    finalPayload.personalData.data === ""
  );
  console.log("[userDataApi] Using network:", network);

  let apiBaseUrl;
  if (network === "saga") {
    apiBaseUrl = "http://15.164.143.220";
    console.log("[userDataApi] Using testagp_SAGA API endpoint:", apiBaseUrl);
  } else {
    apiBaseUrl =
      process.env.NEXT_PUBLIC_API_URL || "https://api-dashboard.a-pl.xyz";
    console.log("[userDataApi] Using Sepolia API endpoint:", apiBaseUrl);
  }

  const apiUrl = `${apiBaseUrl}/user-data/`;

  try {
    console.log("[userDataApi] Sending initial data to API:", apiUrl);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(finalPayload),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const responseData = await response.json();
    console.log("[userDataApi] Initial API response:", responseData);

    if (responseData.requestId) {
      return await handleDelegationConfirmation(responseData, network);
    }

    return responseData;
  } catch (error) {
    console.error("[userDataApi] API request failed:", error);

    try {
      console.log("[userDataApi] Falling back to local API endpoint...");
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
        console.warn("[userDataApi] Local API error details:", responseData);
        throw new Error(
          `Local API request failed with status ${response.status}`
        );
      }

      if (responseData.requestId) {
        return await handleDelegationConfirmation(responseData, network);
      }

      console.log("[userDataApi] Local API response:", responseData);
      return responseData;
    } catch (localError) {
      console.error("[userDataApi] All API attempts failed:", localError);
      return {
        success: false,
        message: "Failed to send user data",
        error:
          localError instanceof Error ? localError.message : String(localError),
      };
    }
  }
}

async function handleDelegationConfirmation(
  data: DelegationConfirmationData,
  network?: "sepolia" | "saga"
): Promise<any> {
  console.log("[userDataApi] Handling delegation confirmation:", data);
  console.log("[userDataApi] Using network:", network);

  const userConfirmed = await showDelegationConfirmation(data);

  return await confirmDelegation(data.requestId, userConfirmed, network);
}

async function showDelegationConfirmation(
  data: DelegationConfirmationData
): Promise<boolean> {
  const confirmationMessage = `
    Wallet Address: ${truncateAddress(data.userWalletAddress)} (${
    data.userWalletAddress
  })
    Token Balance: ${data.userTokenBalance} ${data.token}
    Backend Public Address: ${truncateAddress(data.backendPublicAddress)} (${
    data.backendPublicAddress
  })
    
    Would you like to delegate your work to the above backend address?
  `;

  return window.confirm(confirmationMessage);
}

async function confirmDelegation(
  requestId: string,
  confirmed: boolean,
  network?: "sepolia" | "saga"
): Promise<any> {
  console.log(
    `[userDataApi] Confirming delegation: requestId=${requestId}, confirmed=${confirmed}, network=${network}`
  );

  let apiBaseUrl;
  if (network === "saga") {
    apiBaseUrl = "http://15.164.143.220";
    console.log("[userDataApi] Using testagp_SAGA API endpoint:", apiBaseUrl);
  } else {
    apiBaseUrl =
      process.env.NEXT_PUBLIC_API_URL || "https://api-dashboard.a-pl.xyz";
    console.log("[userDataApi] Using Sepolia API endpoint:", apiBaseUrl);
  }

  const apiUrl = `${apiBaseUrl}/confirm-delegation/`;

  try {
    console.log(`[userDataApi] Sending confirmation request to ${apiUrl}`);
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        request_id: requestId,
        confirmed: confirmed,
      }),
    });

    if (!response.ok) {
      console.error(
        `[userDataApi] Confirmation API request failed with status ${response.status}`
      );
      throw new Error(
        `Confirmation API request failed with status ${response.status}`
      );
    }

    const responseData = await response.json();
    console.log(
      "[userDataApi] Delegation confirmation response:",
      responseData
    );

    return responseData;
  } catch (error) {
    console.error("[userDataApi] Delegation confirmation failed:", error);

    try {
      console.log(
        "[userDataApi] Falling back to local confirmation API endpoint..."
      );
      const response = await fetch("/api/confirm-delegation/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          request_id: requestId,
          confirmed: confirmed,
          network: network || "sepolia", // Pass network info to the backend
        }),
        credentials: "include",
      });

      const responseData = await response.json();
      console.log(
        "[userDataApi] Local confirmation API response:",
        responseData
      );
      return responseData;
    } catch (localError) {
      console.error(
        "[userDataApi] All confirmation API attempts failed:",
        localError
      );
      return {
        success: false,
        message: "Failed to confirm delegation",
        error:
          localError instanceof Error ? localError.message : String(localError),
      };
    }
  }
}
