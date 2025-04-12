"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "../context/WalletContext";
import NetworkToggle from "./NetworkToggle";

export default function NetworkStatus() {
  const { selectedNetwork } = useWallet();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayNetwork = mounted ? selectedNetwork : "sepolia";

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-md">
      <h3 className="text-lg font-semibold text-white mb-3">Network Status</h3>

      <div className="mb-4">
        <div className="text-sm text-gray-400 mb-1">Current Network</div>
        <div className="flex items-center">
          <span
            className={`inline-block w-3 h-3 rounded-full mr-2 ${
              displayNetwork === "sepolia" ? "bg-blue-500" : "bg-purple-500"
            }`}
          />
          <span className="text-white font-medium">
            {displayNetwork === "sepolia" ? "Sepolia Testnet" : "testagp_SAGA"}
          </span>
        </div>
      </div>

      <div className="mb-2">
        <div className="text-sm text-gray-400 mb-2">Switch Network</div>
        <NetworkToggle className="w-full justify-center" />
      </div>

      <p className="text-xs text-gray-500 mt-3">
        Network selection affects all API operations and contract interactions.
      </p>
    </div>
  );
}
