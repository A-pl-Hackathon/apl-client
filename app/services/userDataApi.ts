interface UserDataPayload {
  personalData: {
    walletAddress: string;
    data: string;
  };
  agentModel: string;
}

export async function sendUserData(payload: UserDataPayload): Promise<any> {
  try {
    const response = await fetch("/api/user-data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error sending user data to API:", error);
    throw error;
  }
}
