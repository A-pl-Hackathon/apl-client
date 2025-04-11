"use client";

import { useEffect } from "react";
import Link from "next/link";
import MatrixRain from "./components/MatrixRain";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Matrix Rain Background */}
      <div className="absolute inset-0 z-0">
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

      {/* Error Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen">
        <div className="p-10 backdrop-blur-sm bg-black/30 rounded-2xl shadow-2xl border border-gray-600/30 text-center max-w-md">
          <h2 className="text-4xl font-bold text-white mb-4">
            Something went wrong!
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            An unexpected error has occurred.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={reset}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try again
            </button>
            <Link
              href="/"
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
