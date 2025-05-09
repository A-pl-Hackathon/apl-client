"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "../components/DashboardLayout";

interface Wallet {
  address: string;
  personalData: string;
}

const WalletCard: React.FC<{ wallet: Wallet }> = ({ wallet }) => {
  const [expanded, setExpanded] = useState(false);

  const getDisplayData = () => {
    try {
      const parsedData = JSON.parse(wallet.personalData);

      if (parsedData && parsedData.parsed && parsedData.parsed.data) {
        return parsedData.parsed.data;
      }

      if (parsedData && parsedData.data) {
        return parsedData.data;
      }

      if (typeof parsedData === "object") {
        return JSON.stringify(parsedData, null, 2);
      }

      return parsedData;
    } catch (e) {
      return wallet.personalData;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold truncate w-3/4">{wallet.address}</h3>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-blue-500 hover:text-blue-700"
        >
          {expanded ? "Hide Details" : "View Details"}
        </button>
      </div>

      {expanded && (
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mt-4">
          <h4 className="font-semibold mb-2">Personal Data:</h4>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {getDisplayData()}
          </p>
        </div>
      )}
    </div>
  );
};

export default function DatabasePage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Use absolute URL with origin to ensure correct routing
        const apiUrl = `${window.location.origin}/api/database`;
        console.log(`Fetching data from: ${apiUrl}`);

        const response = await fetch(apiUrl, {
          // Adding cache: 'no-store' to prevent caching issues
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(
            `API request failed: ${response.status} ${response.statusText}`
          );
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "An unknown error occurred.");
        }

        setWallets(result.data);
        console.log(`Loaded ${result.data.length} wallets from API`);

        // Debug log the first wallet's data
        if (result.data.length > 0) {
          console.log("First wallet data example:", result.data[0]);
        }

        setRetryCount(0); // Reset retry count on success
      } catch (err: any) {
        console.error("Error loading data:", err);
        setError(err.message || "An error occurred while loading data.");

        // Auto-retry logic (maximum 3 retries)
        if (retryCount < 3) {
          console.log(`Retrying (${retryCount + 1}/3) in 2 seconds...`);
          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
          }, 2000);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [retryCount]); // Re-fetch when retryCount changes

  const handleRefresh = () => {
    setRetryCount((prev) => prev + 1); // Increment retry count to trigger refetch
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold mb-2 text-white">
            Wallet Database
          </h1>
          <div className="flex space-x-2">
            <button
              onClick={handleRefresh}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              Refresh
            </button>
            <Link
              href="/"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              Return Home
            </Link>
          </div>
        </div>
        <p className="text-gray-400">
          View wallet addresses and personal data stored in the database.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
          <button
            onClick={handleRefresh}
            className="mt-2 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 text-sm">
              <span className="font-semibold">Total Wallets:</span>
              <span className="bg-blue-500 text-white px-2 py-1 rounded-full">
                {wallets.length}
              </span>
            </div>
          </div>

          {wallets.length > 0 ? (
            wallets.map((wallet) => (
              <WalletCard key={wallet.address} wallet={wallet} />
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-xl text-gray-500 dark:text-gray-400">
                No wallet data available.
              </p>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
