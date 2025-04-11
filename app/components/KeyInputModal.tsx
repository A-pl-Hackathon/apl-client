import React, { useState } from "react";

interface KeyInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (secretKey: string, apiKey: string) => void;
}

export default function KeyInputModal({
  isOpen,
  onClose,
  onSubmit,
}: KeyInputModalProps) {
  const [secretKey, setSecretKey] = useState("");
  const [apiKey, setApiKey] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(secretKey, apiKey);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700 shadow-lg">
        <h2 className="text-xl font-bold text-white mb-4">Enter Your Keys</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              className="block text-gray-300 mb-2 text-sm"
              htmlFor="secretKey"
            >
              Secret Key
            </label>
            <input
              id="secretKey"
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your secret key"
              required
            />
          </div>

          <div className="mb-6">
            <label
              className="block text-gray-300 mb-2 text-sm"
              htmlFor="apiKey"
            >
              API Key
            </label>
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your API key"
              required
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Go!
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
