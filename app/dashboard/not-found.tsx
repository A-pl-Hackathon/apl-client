"use client";

import Link from "next/link";
import DashboardLayout from "../components/DashboardLayout";

export default function NotFound() {
  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h2 className="text-4xl font-bold text-white mb-4">
          404 - Dashboard Page Not Found
        </h2>
        <p className="text-xl text-gray-300 mb-8">
          The dashboard page you are looking for does not exist or has been
          moved.
        </p>
        <div className="flex gap-4">
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Dashboard
          </Link>
          <Link
            href="/"
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
