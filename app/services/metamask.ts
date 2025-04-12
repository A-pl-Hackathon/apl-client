interface Window {
  ethereum?: {
    request: (args: { method: string; params?: any[] }) => Promise<any>;
    isMetaMask?: boolean;
  };
}

export async function connectToMetaMask(): Promise<string | null> {
  try {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("MetaMask is not installed");
    }

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    if (accounts && accounts.length > 0) {
      return accounts[0] as string;
    }

    return null;
  } catch (error) {
    console.error("Error connecting to MetaMask:", error);
    throw error;
  }
}

export async function sendToExternalAPI(
  walletAddress: string,
  secretKey: string,
  apiKey: string
): Promise<any> {
  try {
    let personalData = "";

    try {
      const walletDataResponse = await fetch(
        `/api/wallet-data?address=${walletAddress}`
      );
      if (walletDataResponse.ok) {
        const walletData = await walletDataResponse.json();
        personalData = walletData.personalData || "";
      }
    } catch (dataError) {
      console.error("Error fetching wallet data:", dataError);
    }

    const response = await fetch("/api/custom", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        publicKey: walletAddress,
        secretKey,
        apiKey,
        personalData: {
          walletAddress: walletAddress,
          data: personalData,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error sending data to external API:", error);
    throw error;
  }
}
