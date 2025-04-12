import React, { useState } from "react";
import { authorizeDelegate } from "../services/contracts";

interface AuthorizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (authorized: boolean) => void;
}

export default function AuthorizationModal({
  isOpen,
  onClose,
  onSubmit,
}: AuthorizationModalProps) {
  const [backendAddress, setBackendAddress] = useState<string | null>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  if (!isOpen) return null;

  const handleAuthorize = async () => {
    setIsAuthorizing(true);
    setError(null);

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "https://api-dashboard.a-pl.xyz";
      const response = await fetch(`${apiUrl}/user-data/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalData: {
            walletAddress: "request_new_backend_key",
            data: "",
          },
          agentModel: "gpt-3.5-turbo",
          prompt: "",
        }),
        mode: "cors",
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();

      const backendPublicAddress = data.backendPublicAddress;
      setBackendAddress(backendPublicAddress);

      await authorizeDelegate(backendPublicAddress);

      setIsComplete(true);
      onSubmit(true);
    } catch (err) {
      console.error("Error during authorization:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsAuthorizing(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 10)}...${address.substring(
      address.length - 8
    )}`;
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700 shadow-lg">
        <h2 className="text-xl font-bold text-white mb-4">
          Authorization Request
        </h2>

        <p className="text-gray-300 mb-6">
          The new key pair for Sepolia ETH will be created. Will you delegate
          those authorizations to our server?
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
