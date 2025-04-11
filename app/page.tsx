"use client";

import React from "react";
import { useRouter } from "next/navigation";
import MatrixRain from "./components/MatrixRain";
import Link from "next/link";

export default function Home() {
  const router = useRouter();

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

      {/* Overlay with dashboard link */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen">
        <div className="p-10 backdrop-blur-sm bg-black/30 rounded-2xl shadow-2xl border border-gray-600/30 text-center max-w-md transition duration-500 opacity-100">
          <h1 className="text-4xl font-bold text-white mb-6 animate-pulse">
            A.PL
          </h1>
          <Link
            href="/dashboard"
            className="px-8 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-all transform hover:scale-105 active:scale-95 inline-block"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
