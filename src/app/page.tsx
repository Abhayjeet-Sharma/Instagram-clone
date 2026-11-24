
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import Image from "next/image";
import Reels, { Post } from "./components/reels";

interface FeedResponse {
  success: boolean;
  posts: Post[];
  nextCursor: {
    createdAt: string;
    id: string;
  } | null;
  hasMore: boolean;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(true);

  // Prevent duplicate requests and retain the latest cursor.
  const requestInProgress = useRef(false);

  const cursorRef = useRef<{
    createdAt: string;
    id: string;
  } | null>(null);

  const hasMoreRef = useRef(true);

  // Detect when the user approaches the bottom of the feed.
  const { ref: observerRef, inView } = useInView({
    threshold: 0,
    rootMargin: "400px",
  });

  // Fetch currently logged-in user.
  useEffect(() => {
    let active = true;

    async function loadCurrentUser() {
      try {
        const res = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        if (!res.ok) return;

        const data = await res.json();

        if (active) {
          setCurrentUserId(
            data.user?.id ? String(data.user.id) : null
          );
        }
      } catch {
        if (active) {
          setCurrentUserId(null);
        }
      }
    }

    loadCurrentUser();

    return () => {
      active = false;
    };
  }, []);

  // Fetch posts with cursor-based pagination.
  const fetchPosts = useCallback(async (isInitial = false) => {
    if (requestInProgress.current || !hasMoreRef.current) return;

    requestInProgress.current = true;

    if (isInitial) {
      setInitialLoading(true);
    } else {
      setLoadingMore(true);
    }

    setError("");

    try {
      const params = new URLSearchParams({
        limit: "5",
      });

      if (cursorRef.current) {
        params.set("cursorCreatedAt", cursorRef.current.createdAt);
        params.set("cursorId", cursorRef.current.id);
      }

      const response = await fetch(`/api/posts?${params}`, {
        cache: "no-store",
      });

      const data: FeedResponse = await response.json();

      if (!response.ok) {
        throw new Error("Failed to fetch posts");
      }

      // Defensive deduplication.
      setPosts((prev) => {
        const existingIds = new Set(prev.map((post) => post.id));

        const newPosts = data.posts.filter(
          (post) => !existingIds.has(post.id)
        );

        return [...prev, ...newPosts];
      });

      cursorRef.current = data.nextCursor;
      hasMoreRef.current = data.hasMore;
      setHasMore(data.hasMore);

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong"
      );
    } finally {
      requestInProgress.current = false;
      setInitialLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Initial feed request.
  useEffect(() => {
    fetchPosts(true);
  }, [fetchPosts]);

  // Fetch another page when the sentinel enters the viewport.
  useEffect(() => {
    if (inView && hasMore && !loadingMore && !initialLoading && !error) {
      fetchPosts(false);
    }
  }, [
    inView,
    hasMore,
    loadingMore,
    initialLoading,
    error,
    fetchPosts,
  ]);

  // Delete a post.
  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this post?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch("/api/posts", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete post");
      }

      setPosts((currentPosts) =>
        currentPosts.filter((post) => post.id !== id)
      );

    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Something went wrong"
      );
    }
  }

  // Initial Luma loading screen.
  if (initialLoading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <Image
          src="/lumaNeon.png"
          alt="Luma"
          width={140}
          height={50}
          priority
          className="animate-pulse object-contain"
        />
      </main>
    );
  }

  // Initial loading error.
  if (error && posts.length === 0) {
    return (
      <main className="min-h-screen bg-black flex flex-col items-center justify-center">
        <p className="text-gray-400">{error}</p>

        <button
          type="button"
          onClick={() => fetchPosts(true)}
          className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg transition"
        >
          Try again
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      {posts.length === 0 ? (
        <div className="text-center py-20">
          <h2 className="text-xl font-semibold">
            No posts yet
          </h2>

          <p className="text-gray-500 mt-2">
            Upload your first image to get started.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center">
            {posts.map((post) => (
              <Reels
                key={post.id}
                post={post}
                currentUserId={currentUserId}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {/* Infinite scroll sentinel */}
          <div
            ref={observerRef}
            className="h-20 flex items-center justify-center"
          >
            {loadingMore && (
              <p className="text-gray-400 animate-pulse">
                Loading more posts...
              </p>
            )}

            {!hasMore && (
              <p className="text-gray-500">
                You've reached the end!
              </p>
            )}

            {error && posts.length > 0 && (
              <button
                type="button"
                onClick={() => fetchPosts(false)}
                className="text-purple-400 hover:text-purple-300 transition"
              >
                Failed to load. Try again
              </button>
            )}
          </div>
        </>
      )}
    </main>
  );
}
