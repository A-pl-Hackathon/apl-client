"use client";

import React from "react";
import Link from "next/link";
import DashboardLayout from "./components/DashboardLayout";
import Card from "./components/Card";

export default function Home() {
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

      {/* Agent Row - Horizontal layout */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {/* Agent Section - Emphasized */}
        <Card
          title="MY agent"
          titleClassName="text-xl font-bold mb-3 text-white"
          className="bg-gradient-to-r from-purple-600/90 to-purple-800/90 text-white border-2 border-purple-400 shadow-lg transform hover:scale-105 transition-transform cursor-pointer backdrop-blur-md"
        >
          <p className="text-white">
            Configure and monitor your personal agent
          </p>
          <div className="mt-3 flex items-center space-x-2">
            <div className="h-3 w-3 bg-green-500 rounded-full"></div>
            <span className="font-semibold">Status: Online</span>
          </div>
          <button className="mt-3 w-full px-4 py-2 bg-white text-purple-700 rounded-lg font-bold hover:bg-purple-100 transition-colors">
            Agent Settings
          </button>
        </Card>

        {/* Section a-wrong */}
        <Card
          title="a-wrong"
          className="bg-gray-100/80 dark:bg-gray-800/80 hover:shadow-xl transition-shadow cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 border border-transparent backdrop-blur-sm"
        >
          <p className="text-gray-700 dark:text-gray-300">
            Monitor and fix incorrect responses
          </p>
          <div className="mt-3 flex items-center space-x-2">
            <div className="h-3 w-3 bg-green-500 rounded-full"></div>
            <span>Status: Active</span>
          </div>
        </Card>

        {/* Section b */}
        <Card
          title="b"
          className="bg-gray-100/80 dark:bg-gray-800/80 hover:shadow-xl transition-shadow cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 border border-transparent backdrop-blur-sm"
        >
          <p className="text-gray-700 dark:text-gray-300">Section b content</p>
        </Card>

        {/* Section c */}
        <Card
          title="c"
          className="bg-gray-100/80 dark:bg-gray-800/80 hover:shadow-xl transition-shadow cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 border border-transparent backdrop-blur-sm"
        >
          <p className="text-gray-700 dark:text-gray-300">Section c content</p>
        </Card>
      </div>
    </DashboardLayout>
  );
}
