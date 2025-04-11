"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "../components/DashboardLayout";

// Type definitions
interface Post {
  id?: number;
  author: string;
  content: string;
  createdAt: string;
}

interface Comment {
  id?: number;
  postId: number;
  author: string;
  content: string;
  createdAt: string;
  readAt: string | null;
  likedAt: string | null;
}

const PostCard: React.FC<{ post: Post; comments: Comment[] }> = ({
  post,
  comments,
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">{post.author}</h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {post.createdAt}
        </span>
      </div>
      <p className="text-gray-700 dark:text-gray-300 mb-4">{post.content}</p>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center text-blue-500 hover:text-blue-700"
        >
          <span>
            {expanded ? "Hide Comments" : `View ${comments.length} Comments`}
          </span>
          <svg
            className={`w-4 h-4 ml-1 transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {expanded && (
          <div className="mt-4 space-y-3">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{comment.author}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {comment.createdAt}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">
                    {comment.content}
                  </p>
                  <div className="flex mt-2 text-xs text-gray-500 dark:text-gray-400 space-x-4">
                    <span>
                      {comment.readAt ? `Read: ${comment.readAt}` : "Unread"}
                    </span>
                    <span>
                      {comment.likedAt
                        ? `Liked: ${comment.likedAt}`
                        : "No likes"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center">
                No comments available.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default function DatabasePage() {
  const [postsWithComments, setPostsWithComments] = useState<
    Array<Post & { comments: Comment[] }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch("/api/database");

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "An unknown error occurred.");
        }

        setPostsWithComments(result.data);
      } catch (err: any) {
        console.error("Error loading data:", err);
        setError(err.message || "An error occurred while loading data.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  const totalComments = postsWithComments.reduce(
    (total, post) => total + post.comments.length,
    0
  );

  return (
    <DashboardLayout>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold mb-2 text-white">
            Database Viewer
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
          View posts and comments stored in the SQLite database.
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
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 text-sm">
              <span className="font-semibold">Total Posts:</span>
              <span className="bg-blue-500 text-white px-2 py-1 rounded-full">
                {postsWithComments.length}
              </span>
              <span className="font-semibold ml-4">Total Comments:</span>
              <span className="bg-green-500 text-white px-2 py-1 rounded-full">
                {totalComments}
              </span>
            </div>
          </div>

          {postsWithComments.length > 0 ? (
            postsWithComments.map((post) => (
              <PostCard key={post.id} post={post} comments={post.comments} />
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-xl text-gray-500 dark:text-gray-400">
                No data available.
              </p>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
