import React, { useState, useEffect } from "react";
import { liteDb, Wallet } from "../db";

interface UserDataCardProps {
  walletAddress: string;
  formatAccount: (address: string) => string;
}

type AIModel = {
  id: string;
  name: string;
  provider: string;
  available: boolean;
};

const AI_MODELS: AIModel[] = [
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    provider: "OpenAI",
    available: true,
  },
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", available: true },
  { id: "gemini-2.0", name: "Gemini 2.0", provider: "Google", available: true },
  {
    id: "claude-3-opus",
    name: "Claude 3 Opus",
    provider: "Anthropic",
    available: false,
  },
  { id: "llama-3", name: "Llama 3", provider: "Meta", available: false },
  {
    id: "mistral-large",
    name: "Mistral Large",
    provider: "Mistral AI",
    available: false,
  },
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    provider: "OpenAI",
    available: false,
  },
];

export default function UserDataCard({
  walletAddress,
  formatAccount,
}: UserDataCardProps) {
  const [personalData, setPersonalData] = useState("");
  const [selectedModel, setSelectedModel] = useState<string>("gpt-3.5-turbo");
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const fetchWalletData = async () => {
      if (walletAddress && typeof window !== "undefined") {
        try {
          console.log(
            "[UserDataCard] Fetching wallet data for:",
            walletAddress
          );
          console.log(
            "[UserDataCard] Wallet address type:",
            typeof walletAddress
          );
          console.log(
            "[UserDataCard] Wallet address length:",
            walletAddress.length
          );

          const walletData = await liteDb.getWalletByAddress(walletAddress);
          console.log("[UserDataCard] Retrieved wallet data:", walletData);

          if (walletData && walletData.personalData) {
            console.log(
              "[UserDataCard] Personal data type:",
              typeof walletData.personalData
            );
            console.log(
              "[UserDataCard] Personal data:",
              walletData.personalData
            );

            // Try to parse personalData if it's a JSON string
            try {
              const parsedData = JSON.parse(walletData.personalData);
              console.log("[UserDataCard] Parsed data:", parsedData);

              if (parsedData.data) {
                console.log(
                  "[UserDataCard] Setting parsed personal data:",
                  parsedData.data
                );
                setPersonalData(parsedData.data);
              } else {
                console.log(
                  "[UserDataCard] Setting personal data directly:",
                  walletData.personalData
                );
                setPersonalData(walletData.personalData);
              }
            } catch (e) {
              // If it's not a valid JSON, use it directly
              console.log(
                "[UserDataCard] Failed to parse JSON, setting personal data directly:",
                walletData.personalData
              );
              setPersonalData(walletData.personalData);
            }
          } else {
            console.log(
              "[UserDataCard] No saved data found for wallet, clearing personal data"
            );
            setPersonalData("");

            // Create a new wallet entry if none exists
            const newWallet: Wallet = {
              address: walletAddress,
              personalData: "",
            };
            console.log("[UserDataCard] Creating new wallet entry:", newWallet);
            await liteDb.upsertWallet(newWallet);
          }

          // Debug: List all wallets in database
          const allWallets = await liteDb.getAllWallets();
          console.log(
            `[UserDataCard] Total wallets in database: ${allWallets.length}`
          );
          console.log("[UserDataCard] All wallets:", allWallets);
        } catch (error) {
          console.error("[UserDataCard] Error fetching wallet data:", error);
        }
      } else {
        console.log(
          "[UserDataCard] No wallet address provided, clearing personal data"
        );
        setPersonalData("");
      }
    };

    fetchWalletData();
  }, [walletAddress]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitSuccess(false);
    setSubmitError("");

    try {
      if (!walletAddress) {
        throw new Error("Wallet address is required");
      }

      const personalDataObj = {
        walletAddress,
        data: personalData,
      };

      const serializedData = JSON.stringify(personalDataObj);
      console.log("[UserDataCard] Serialized data to save:", serializedData);
      console.log("[UserDataCard] Data type:", typeof serializedData);

      const wallet: Wallet = {
        address: walletAddress,
        personalData: serializedData,
      };

      console.log("[UserDataCard] Saving wallet to database:", wallet);

      if (typeof window !== "undefined") {
        await liteDb.upsertWallet(wallet);

        const savedWallet = await liteDb.getWalletByAddress(walletAddress);
        console.log("[UserDataCard] Wallet data after save:", savedWallet);

        if (savedWallet) {
          console.log(
            "[UserDataCard] Saved personal data:",
            savedWallet.personalData
          );
          console.log(
            "[UserDataCard] Personal data type:",
            typeof savedWallet.personalData
          );

          try {
            const parsed = JSON.parse(savedWallet.personalData);
            console.log("[UserDataCard] Parsed saved data:", parsed);
          } catch (e) {
            console.log("[UserDataCard] Could not parse saved data as JSON");
          }
        }

        try {
          const apiResponse = await fetch(`/api/database`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              address: walletAddress,
              personalData: serializedData,
            }),
          });

          if (apiResponse.ok) {
            console.log(
              "[UserDataCard] Successfully updated wallet via API route"
            );
            const responseData = await apiResponse.json();
            console.log("[UserDataCard] API response:", responseData);
          } else {
            console.warn(
              "[UserDataCard] API route update failed, but IndexedDB update succeeded"
            );
          }
        } catch (apiError) {
          console.warn(
            "[UserDataCard] API route update failed, but IndexedDB update succeeded:",
            apiError
          );
        }
      }

      setSubmitSuccess(true);
      console.log("[UserDataCard] Data successfully saved to local database");

      // Verify all wallets in database after update
      if (typeof window !== "undefined") {
        const allWallets = await liteDb.getAllWallets();
        console.log(
          `[UserDataCard] Total wallets in database after update: ${allWallets.length}`
        );
        console.log("[UserDataCard] Updated wallet list:", allWallets);
      }
    } catch (error) {
      console.error("[UserDataCard] Error in handleSubmit:", error);
      setSubmitError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="bg-gray-800/90 backdrop-blur-md rounded-lg shadow-lg border border-gray-700/50 p-4"
      data-selected-model={selectedModel}
    >
      <h2 className="text-xl font-bold text-white mb-3">Personal Data</h2>

      <div className="mb-4 p-3 bg-gray-700/70 rounded-lg">
        <p className="text-gray-300 text-sm mb-1">Connected Wallet</p>
        <p className="text-white font-mono">
          {walletAddress ? formatAccount(walletAddress) : "Not connected"}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            htmlFor="personalData"
            className="block text-gray-300 mb-2 text-sm"
          >
            Personal Data
          </label>
          <textarea
            id="personalData"
            value={personalData}
            onChange={(e) => setPersonalData(e.target.value)}
            placeholder="Enter your personal information here..."
            className="w-full bg-gray-700/80 text-white px-3 py-2 rounded-lg h-[200px] focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {submitSuccess && (
          <div className="mb-4 p-2 bg-green-500/20 border border-green-500 rounded text-green-400 text-sm">
            Data submitted successfully!
          </div>
        )}

        {submitError && (
          <div className="mb-4 p-2 bg-red-500/20 border border-red-500 rounded text-red-400 text-sm">
            Error: {submitError}
          </div>
        )}

        <button
          type="submit"
          disabled={!walletAddress || isSubmitting}
          className={`w-full py-2 rounded-lg font-semibold transition-all ${
            isSubmitting
              ? "bg-blue-700/50 text-white/50 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {isSubmitting ? "Submitting..." : "Save Data"}
        </button>
      </form>
    </div>
  );
}
