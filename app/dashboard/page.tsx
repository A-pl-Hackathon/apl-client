"use client";

import React from "react";
import Link from "next/link";
import DashboardLayout from "../components/DashboardLayout";
import Card from "../components/Card";
import UserDataCard from "../components/UserDataCard";
import { useWallet } from "../context/WalletContext";

export default function Dashboard() {
  const { account } = useWallet();

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Blog Post Section */}
        <Card title="Blog Post" className="h-52">
          <p className="text-gray-700 dark:text-gray-300">
            View and manage your blog posts
          </p>
          <Link
            href="/posts"
            className="text-blue-500 hover:text-blue-700 mt-4 inline-block"
          >
            View All Posts →
          </Link>
        </Card>

        {/* Interaction Section */}
        <Card
          title="Interaction"
          className="h-52 bg-red-200/90 dark:bg-red-900/70"
        >
          <div className="space-y-3">
            <p className="text-gray-700 dark:text-gray-300">
              Comment, Like and Share interactions
            </p>
            <div className="flex space-x-2 mt-4">
              <span className="px-3 py-1 bg-gray-200/80 dark:bg-gray-700/80 rounded-full text-sm">
                Comments: 24
              </span>
              <span className="px-3 py-1 bg-gray-200/80 dark:bg-gray-700/80 rounded-full text-sm">
                Likes: 105
              </span>
            </div>
          </div>
        </Card>
      </div>
      <UserDataCard
        walletAddress={account || ""}
        formatAccount={(address) =>
          `${address.substring(0, 10)}...${address.substring(
            address.length - 4
          )}`
        }
      />
    </DashboardLayout>
  );
}
