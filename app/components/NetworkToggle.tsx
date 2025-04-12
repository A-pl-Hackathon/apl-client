"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "../context/WalletContext";

interface NetworkToggleProps {
  className?: string;
}

export default function NetworkToggle({ className = "" }: NetworkToggleProps) {
  const { selectedNetwork, toggleNetwork } = useWallet();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayNetwork = mounted ? selectedNetwork : "sepolia";

  return (
    <button
      onClick={toggleNetwork}
      className={`flex items-center px-3 py-1.5 rounded transition-all ${
        displayNetwork === "sepolia"
          ? "bg-blue-600 hover:bg-blue-700 text-white"
          : "bg-purple-600 hover:bg-purple-700 text-white"
      } ${className}`}
    >
      <span className="mr-2">
        {displayNetwork === "sepolia" ? "Sepolia" : "testagp_SAGA"}
      </span>
      <span
        className={`w-2.5 h-2.5 rounded-full ${
          displayNetwork === "sepolia" ? "bg-blue-300" : "bg-purple-300"
        }`}
      ></span>
    </button>
  );
}
