"use client";

import React from "react";

type StatusIndicatorProps = {
  isActive: boolean;
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  isActive,
}) => {
  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 bg-black/5 dark:bg-white/5 rounded-full mb-4 transition-all duration-300 ease-in-out ${
        isActive ? "bg-green-50 dark:bg-green-950/20" : ""
      }`}
    >
      <div
        className={`relative w-3 h-3 rounded-full transition-colors duration-300 ${
          isActive ? "bg-green-500" : "bg-gray-400"
        }`}
      >
        {isActive && (
          <>
            <span className="absolute top-0 left-0 rounded-full w-full h-full bg-green-500 animate-ping opacity-75"></span>
            <span className="absolute top-0 left-0 rounded-full w-full h-full bg-green-400 animate-pulse"></span>
          </>
        )}
      </div>
      <span
        className={`text-sm font-medium transition-all duration-300 ${
          isActive ? "text-green-700 dark:text-green-400" : ""
        }`}
      >
        {isActive ? "A.pl Running..." : "A.pl Ready"}
      </span>
    </div>
  );
};
