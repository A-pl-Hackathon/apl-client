import React, { useState, useEffect } from "react";
import { sendUserData } from "../services/userDataApi";
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
      if (walletAddress) {
        try {
          const walletData = await liteDb.getWalletByAddress(walletAddress);
          if (walletData && walletData.personalData) {
            setPersonalData(walletData.personalData);
          }
        } catch (error) {
          console.error("Error fetching wallet data:", error);
        }
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
      if (walletAddress) {
        await liteDb.upsertWallet({
          address: walletAddress,
          personalData: personalData,
        });
      }

      const payload = {
        personalData: {
          walletAddress,
          data: personalData,
        },
        agentModel: selectedModel,
      };

      await sendUserData(payload);
      setSubmitSuccess(true);
    } catch (error) {
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
            className="w-full bg-gray-700/80 text-white px-3 py-2 rounded-lg h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
}
