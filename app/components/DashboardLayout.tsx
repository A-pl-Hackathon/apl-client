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

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [chatbotVisible, setChatbotVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLogoLoading, setIsLogoLoading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gpt-3.5-turbo");
  const { account, connecting, connectWallet, disconnectWallet, tokenBalance } =
    useWallet();

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
        await connectWallet();
      }

      if (account) {
        const walletData = await getWalletData(account);

        const payload = {
          personalData: {
            walletAddress: account,
            data: walletData.personalData || "",
          },
          agentModel: selectedModel,
          prompt: "",
        };

        await sendUserData(payload);
      }
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
              disabled={isLoading}
              className={`px-4 py-1.5 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                isLoading ? "animate-pulse" : ""
              }`}
            >
              {isLoading ? "Sending..." : "Go!"}
            </button>

            {!account ? (
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
            ) : (
              <div className="flex items-center space-x-2">
                <div className="flex flex-col items-end">
                  <span className="text-white text-xs">
                    {formatAccount(account)}
                  </span>
                  {tokenBalance !== "0" && (
                    <span className="text-orange-400 text-xs">
                      {tokenBalance} MTK
                    </span>
                  )}
                </div>
                <button
                  onClick={disconnectWallet}
                  className="text-xs px-2 py-1 bg-gray-700 text-white rounded hover:bg-gray-600"
                >
                  Disconnect
                </button>
              </div>
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
