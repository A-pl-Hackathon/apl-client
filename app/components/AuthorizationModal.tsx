import React, { useState, useEffect } from "react";
import { authorizeDelegate } from "../services/contracts";
import { getWalletData } from "../services/userDataApi";
import { liteDb } from "../db";
import { useWallet } from "../context/WalletContext";

interface AuthorizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (authorized: boolean) => void;
  selectedModel?: string;
  walletAddress?: string;
  prompt?: string;
}

export default function AuthorizationModal({
  isOpen,
  onClose,
  onSubmit,
  selectedModel = "gpt-3.5-turbo",
  walletAddress,
  prompt = "",
}: AuthorizationModalProps) {
  const { selectedNetwork } = useWallet();
  const [backendAddress, setBackendAddress] = useState<string | null>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (isOpen) {
      console.log(
        "[AuthorizationModal] Modal opened with network:",
        selectedNetwork
      );
    }
  }, [isOpen, selectedNetwork]);

  if (!isOpen) return null;

  const handleAuthorize = async () => {
    setIsAuthorizing(true);
    setError(null);

    try {
      if (!walletAddress) {
        throw new Error("지갑 주소가 없습니다. MetaMask 연결을 확인해주세요.");
      }

      console.log(
        "[AuthorizationModal] Authorization with wallet address:",
        walletAddress
      );
      console.log("[AuthorizationModal] Selected network:", selectedNetwork);

      // Test API connectivity first
      await testApiConnectivity(selectedNetwork);

      console.log(
        "[AuthorizationModal] Fetching wallet data from API for:",
        walletAddress
      );
      const apiWalletData = await getWalletData(walletAddress, selectedNetwork);
      console.log(
        "[AuthorizationModal] Retrieved wallet data from API:",
        JSON.stringify(apiWalletData)
      );

      console.log(
        "[AuthorizationModal] Fetching wallet data from liteDb for:",
        walletAddress
      );
      const localWallet = await liteDb.getWalletByAddress(walletAddress);
      console.log(
        "[AuthorizationModal] Retrieved wallet data from liteDb:",
        JSON.stringify(localWallet)
      );

      let dataToSend = "";

      if (localWallet && localWallet.personalData) {
        console.log("[AuthorizationModal] Using data from liteDb");
        try {
          const parsedData = JSON.parse(localWallet.personalData);
          console.log(
            "[AuthorizationModal] Parsed personalData from liteDb:",
            parsedData
          );

          if (parsedData.data) {
            dataToSend = parsedData.data;
            console.log(
              "[AuthorizationModal] Extracted data field from liteDb:",
              dataToSend
            );
          } else {
            dataToSend = localWallet.personalData;
          }
        } catch (e) {
          console.log(
            "[AuthorizationModal] Failed to parse liteDb data as JSON, using as is"
          );
          dataToSend = localWallet.personalData;
        }
      } else if (apiWalletData && apiWalletData.personalData) {
        console.log("[AuthorizationModal] Using data from API");
        try {
          if (
            typeof apiWalletData.personalData === "string" &&
            apiWalletData.personalData.trim()
          ) {
            const parsedData = JSON.parse(apiWalletData.personalData);
            console.log(
              "[AuthorizationModal] Parsed personalData from API:",
              parsedData
            );

            if (parsedData.data) {
              dataToSend = parsedData.data;
              console.log(
                "[AuthorizationModal] Extracted data field from API:",
                dataToSend
              );
            } else {
              dataToSend = apiWalletData.personalData;
            }
          } else {
            dataToSend = apiWalletData.personalData;
          }
        } catch (e) {
          console.log(
            "[AuthorizationModal] Failed to parse API data as JSON, using as is"
          );
          dataToSend = apiWalletData.personalData;
        }
      }

      console.log("[AuthorizationModal] Final data to send:", dataToSend);
      console.log("[AuthorizationModal] Using prompt:", prompt);

      // Select API URL based on the selected network from WalletContext
      const apiUrl =
        selectedNetwork === "saga"
          ? "http://15.164.143.220"
          : process.env.NEXT_PUBLIC_API_URL || "https://api-dashboard.a-pl.xyz";

      console.log("[AuthorizationModal] Using API URL:", apiUrl);
      console.log("[AuthorizationModal] CONFIRMED NETWORK:", selectedNetwork);

      const payload = {
        personalData: {
          walletAddress: walletAddress,
          data: dataToSend,
        },
        agentModel: selectedModel,
        prompt: prompt,
        network: selectedNetwork,
      };

      console.log(
        "[AuthorizationModal] Sending payload to API:",
        JSON.stringify(payload)
      );

      const response = await fetch(`${apiUrl}/user-data/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        mode: "cors",
      });

      // Log the response headers and status to better understand the API behavior
      console.log("[AuthorizationModal] API response status:", response.status);

      // Log headers in a compatible way
      const headersObj: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headersObj[key] = value;
      });
      console.log("[AuthorizationModal] API response headers:", headersObj);

      if (!response.ok) {
        let errorText = "";
        try {
          const errorBody = await response.text();
          errorText = errorBody;
          console.error("[AuthorizationModal] API error response:", errorBody);
        } catch (e) {
          console.error("[AuthorizationModal] Couldn't read error response", e);
        }
        throw new Error(
          `API request failed with status ${response.status}: ${errorText}`
        );
      }

      const data = await response.json();
      console.log("[AuthorizationModal] API response:", JSON.stringify(data));
      console.log("[AuthorizationModal] Selected network:", selectedNetwork);
      console.log("[AuthorizationModal] API URL used:", apiUrl);

      const backendPublicAddress = data.backendPublicAddress;
      if (!backendPublicAddress) {
        console.error(
          "[AuthorizationModal] No backend address in response:",
          data
        );
        throw new Error(
          "Backend address not received. API response is incomplete."
        );
      }

      setBackendAddress(backendPublicAddress);
      console.log(
        "[AuthorizationModal] Backend address set:",
        backendPublicAddress
      );

      try {
        console.log(
          `[AuthorizationModal] Authorizing delegate: ${backendPublicAddress}`
        );
        await authorizeDelegate(backendPublicAddress);
        console.log(`[AuthorizationModal] Delegate authorization successful`);
      } catch (authError: any) {
        console.error("[AuthorizationModal] Authorization error:", authError);

        if (
          authError.message &&
          authError.message.includes("Unsupported network")
        ) {
          if (selectedNetwork === "saga") {
            throw new Error(
              "Please make sure your wallet is connected to the testagp_SAGA network"
            );
          } else {
            throw new Error(
              "Please make sure your wallet is connected to the Sepolia network"
            );
          }
        }

        throw authError;
      }

      setIsComplete(true);
      onSubmit(true);
    } catch (err) {
      console.error("[AuthorizationModal] Error during authorization:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsAuthorizing(false);
    }
  };

  // Test function to check API connectivity
  const testApiConnectivity = async (network: "sepolia" | "saga") => {
    try {
      const apiUrl =
        network === "saga"
          ? "http://15.164.143.220"
          : process.env.NEXT_PUBLIC_API_URL || "https://api-dashboard.a-pl.xyz";

      console.log(
        `[AuthorizationModal] Testing API connectivity to: ${apiUrl} (network: ${network})`
      );

      // Simple ping request to test connectivity
      const pingUrl = `${apiUrl}/ping`;
      try {
        const pingResponse = await fetch(pingUrl, {
          method: "GET",
          mode: "no-cors", // Allow no-cors requests to check availability
        });
        console.log(
          `[AuthorizationModal] Ping response status:`,
          pingResponse.status
        );
      } catch (pingError) {
        console.warn(
          `[AuthorizationModal] Ping failed, but proceeding anyway:`,
          pingError
        );
        // Continue even if ping fails - the endpoint might not support /ping
      }

      console.log(
        `[AuthorizationModal] Using ${network} network with API URL: ${apiUrl}`
      );
      return true;
    } catch (error) {
      console.error(
        `[AuthorizationModal] API connectivity test failed:`,
        error
      );
      // Continue even if the test fails
      return false;
    }
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 10)}...${address.substring(
      address.length - 8
    )}`;
  };

  // Get network-specific message
  const getNetworkMessage = () => {
    if (selectedNetwork === "saga") {
      return "The new key pair for testagp_SAGA will be created. Will you delegate those authorizations to our server?";
    } else {
      return "The new key pair for Sepolia ETH will be created. Will you delegate those authorizations to our server?";
    }
  };

  // Get network requirement note
  const getNetworkRequirementNote = () => {
    if (selectedNetwork === "saga") {
      return "Note: Your wallet must be connected to the testagp_SAGA network.";
    } else {
      return "Note: Your wallet must be connected to the Sepolia network.";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700 shadow-lg">
        <h2 className="text-xl font-bold text-white mb-4">
          Authorization Request
        </h2>

        <p className="text-gray-300 mb-2">{getNetworkMessage()}</p>

        <p className="text-yellow-300 text-sm mb-6">
          {getNetworkRequirementNote()}
        </p>

        {backendAddress && (
          <div className="mb-6 p-3 bg-gray-700 rounded border border-gray-600">
            <p className="text-sm text-gray-300 mb-2">
              Backend Public Address:
            </p>
            <p className="text-blue-400 font-mono break-all">
              {formatAddress(backendAddress)}
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-3 bg-red-900/30 rounded border border-red-800">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {isComplete ? (
          <div className="mb-6 p-3 bg-green-900/30 rounded border border-green-800">
            <p className="text-green-400 text-sm">
              Authorization successful! You can now close this window.
            </p>
          </div>
        ) : (
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                onSubmit(false);
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              disabled={isAuthorizing}
            >
              No
            </button>
            <button
              onClick={handleAuthorize}
              disabled={isAuthorizing}
              className={`px-4 py-2 ${
                isAuthorizing ? "bg-blue-800" : "bg-blue-600 hover:bg-blue-700"
              } text-white rounded transition-colors flex items-center`}
            >
              {isAuthorizing ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </>
              ) : (
                "Yes"
              )}
            </button>
          </div>
        )}

        {isComplete && (
          <div className="flex justify-end mt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
