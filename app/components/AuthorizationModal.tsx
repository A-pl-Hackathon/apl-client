import React from "react";

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
  if (!isOpen) return null;

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

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              onSubmit(false);
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            No
          </button>
          <button
            onClick={() => onSubmit(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
}
