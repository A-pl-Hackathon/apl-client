"use client";

import React, { ReactNode, useState } from "react";
import MatrixRain from "./MatrixRain";
import Chatbot from "./Chatbot";
import Link from "next/link";
import { useWallet } from "../context/WalletContext";
import AuthorizationModal from "./AuthorizationModal";
import { connectToMetaMask } from "../services/metamask";
import { sendUserData, getWalletData } from "../services/userDataApi";
import UserDataCard from "./UserDataCard";
import { liteDb } from "../db";
import NetworkToggle from "./NetworkToggle";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [chatbotVisible, setChatbotVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLogoLoading, setIsLogoLoading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gpt-3.5-turbo");
  const {
    account,
    connecting,
    connectWallet,
    disconnectWallet,
    tokenBalance,
    tokenSymbol,
    selectedNetwork,
    toggleNetwork,
  } = useWallet();

  const toggleChatbot = () => {
    setChatbotVisible(!chatbotVisible);
  };

  const handleLogoClick = () => {
    window.location.href = "/";
  };

  const handleGoClick = () => {
    if (isLoading) return;
    setIsAuthModalOpen(true);
  };

  const handleAuthSubmit = async (authorized: boolean) => {
    try {
      if (!authorized) return;

      setIsLoading(true);

      if (!account) {
        console.log(
          "[DashboardLayout] No wallet connected, attempting to connect..."
        );
        await connectWallet();
      }

      const walletAddress = account;
      console.log("[DashboardLayout] Current wallet address:", walletAddress);
      console.log(
        "[DashboardLayout] Wallet account type:",
        typeof walletAddress
      );
      console.log(
        "[DashboardLayout] Wallet account length:",
        walletAddress ? walletAddress.length : 0
      );

      if (!walletAddress) {
        console.error("[DashboardLayout] Failed to get wallet address");
        return;
      }

      console.log(
        "[DashboardLayout] Fetching wallet data from API for:",
        walletAddress
      );
      console.log("[DashboardLayout] Using network:", selectedNetwork);
      const apiWalletData = await getWalletData(walletAddress, selectedNetwork);
      console.log(
        "[DashboardLayout] Retrieved wallet data from API:",
        JSON.stringify(apiWalletData)
      );

      console.log(
        "[DashboardLayout] Fetching wallet data from liteDb for:",
        walletAddress
      );
      const localWallet = await liteDb.getWalletByAddress(walletAddress);
      console.log(
        "[DashboardLayout] Retrieved wallet data from liteDb:",
        JSON.stringify(localWallet)
      );

      let dataToSend = "";

      if (localWallet && localWallet.personalData) {
        console.log("[DashboardLayout] Using data from liteDb");
        try {
          const parsedData = JSON.parse(localWallet.personalData);
          console.log(
            "[DashboardLayout] Parsed personalData from liteDb:",
            parsedData
          );

          if (parsedData.data) {
            dataToSend = parsedData.data;
            console.log(
              "[DashboardLayout] Extracted data field from liteDb:",
              dataToSend
            );
          } else {
            dataToSend = localWallet.personalData;
          }
        } catch (e) {
          console.log(
            "[DashboardLayout] Failed to parse liteDb data as JSON, using as is"
          );
          dataToSend = localWallet.personalData;
        }
      } else if (apiWalletData && apiWalletData.personalData) {
        console.log("[DashboardLayout] Using data from API");
        try {
          if (
            typeof apiWalletData.personalData === "string" &&
            apiWalletData.personalData.trim()
          ) {
            const parsedData = JSON.parse(apiWalletData.personalData);
            console.log(
              "[DashboardLayout] Parsed personalData from API:",
              parsedData
            );

            if (parsedData.data) {
              dataToSend = parsedData.data;
              console.log(
                "[DashboardLayout] Extracted data field from API:",
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
            "[DashboardLayout] Failed to parse API data as JSON, using as is"
          );
          dataToSend = apiWalletData.personalData;
        }
      }
      console.log("[DashboardLayout] Final data to send:", dataToSend);

      const payload = {
        personalData: {
          walletAddress: walletAddress,
          data: dataToSend,
        },
        agentModel: selectedModel,
        prompt: "",
        network: selectedNetwork,
      };

      console.log(
        "[DashboardLayout] Payload prepared:",
        JSON.stringify(payload)
      );
      console.log(
        "[DashboardLayout] Sending payload with address:",
        payload.personalData.walletAddress
      );
      console.log(
        "[DashboardLayout] Sending payload with data:",
        payload.personalData.data
      );
      console.log(
        "[DashboardLayout] Data type:",
        typeof payload.personalData.data
      );
      console.log("[DashboardLayout] Using network:", payload.network);

      const response = await sendUserData(payload);
      console.log("[DashboardLayout] API response:", JSON.stringify(response));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      console.error("Error:", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAccount = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Matrix Rain Background - fullScreen mode with fixed position */}
      <div className="fixed inset-0 z-0">
        <MatrixRain
          fullScreen={true}
          charSet={[
            "0",
            "1",
            "@",
            "#",
            "$",
            "%",
            "&",
            "=",
            "+",
            "-",
            "*",
            "/",
            "<",
            ">",
          ]}
        />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-20 bg-black/90 backdrop-blur-md shadow-md h-15 flex items-center px-4 border-b border-gray-800/50">
        <div className="container mx-auto flex justify-between items-center">
          <button
            className={`text-white text-2xl font-bold tracking-wider hover:text-blue-400 transition-colors transform hover:scale-105 active:scale-95 ${
              isLogoLoading ? "opacity-70" : ""
            }`}
            onClick={handleLogoClick}
          >
            A.PL
          </button>
          <div className="flex items-center space-x-4">
            <Link
              href="/database"
              className="text-white hover:text-blue-400 transition-colors"
            >
              Database
            </Link>
            <Link
              href="/tokens"
              className="text-white hover:text-blue-400 transition-colors"
            >
              Tokens
            </Link>
            <button
              onClick={handleGoClick}
              className={`px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors ${
                isLoading ? "opacity-70 cursor-not-allowed" : ""
              }`}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
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
                  Processing
                </span>
              ) : (
                "Go"
              )}
            </button>

            {/* Network Toggle */}
            <NetworkToggle />

            {account ? (
              <div className="flex items-center space-x-3">
                <div className="flex flex-col items-end">
                  <span className="text-white text-xs">
                    {formatAccount(account)}
                  </span>
                  {tokenBalance !== "0" && (
                    <span className="text-orange-400 text-xs">
                      {tokenBalance} {tokenSymbol || "AGP"}
                    </span>
                  )}
                </div>
                <button
                  onClick={disconnectWallet}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={connecting}
                className="flex items-center space-x-1 px-3 py-1.5 bg-orange-500 text-white rounded-full font-semibold hover:bg-orange-600 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <img
                  src="/metamask-fox.svg"
                  alt="MetaMask"
                  className="w-4 h-4"
                />
                <span>{connecting ? "Connecting..." : "Connect Wallet"}</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Container - positioned above the matrix background */}
      <div className="relative z-10 min-h-screen pt-36 overflow-x-hidden">
        {/* Content Wrapper */}
        <div className="container mx-auto px-4">
          {/* Main content - width changes based on chatbot visibility */}
          <div
            className={`w-full transition-all duration-300 ${
              chatbotVisible ? "md:w-8/12 md:mr-[380px]" : "md:w-11/12 mx-auto"
            }`}
          >
            <div className="mt-4">{children}</div>
          </div>

          {/* Chatbot Toggle Button - Fixed to the right edge */}
          <button
            onClick={toggleChatbot}
            className="fixed right-0 top-[40%] transform -translate-y-1/2 z-30 bg-blue-600 text-white p-2 rounded-l-md shadow-lg hover:bg-blue-700 transition-colors"
            aria-label={chatbotVisible ? "Hide chatbot" : "Show chatbot"}
          >
            {chatbotVisible ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 5l7 7-7 7M5 5l7 7-7 7"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              </svg>
            )}
          </button>

          {/* Right Side - Chatbot */}
          <div
            className={`fixed top-18 right-[70px] bottom-0 w-[450px] transition-transform duration-300 ease-in-out ${
              chatbotVisible ? "translate-x-0" : "translate-x-[800px]"
            } z-20`}
          >
            <Chatbot />
          </div>
        </div>
      </div>

      {/* Authorization Modal */}
      <AuthorizationModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSubmit={handleAuthSubmit}
        selectedModel={selectedModel}
        walletAddress={account || undefined}
      />
    </div>
  );
}
