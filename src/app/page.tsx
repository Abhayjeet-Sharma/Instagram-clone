"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import Reels, { Post } from "./components/reels";
import SocketTest from "./components/SocketTest";

interface FeedResponse {
  success: boolean;
  posts: Post[];
  nextCursor: {
    createdAt: string;
    id: string;
  } | null;
  hasMore: boolean;
}

interface AuthUser {
  id: string;
  username:string
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUsername,setCurrentUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(true);

  // Refs prevent duplicate requests and retain the latest cursor.
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

  // Fetch currently logged-in user so we can check post ownership.
  useEffect(() => {
    let active = true;

    async function loadCurrentUser() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (active) {
          setCurrentUserId(data.user?.id ? String(data.user.id) : null);
          setCurrentUsername(data.user?.username ? String(data.user.username):null);
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

  const fetchPosts = useCallback(async () => {
    if (requestInProgress.current || !hasMoreRef.current) return;

    requestInProgress.current = true;

    try {
      setLoading(true);
      setError("");

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

      setPosts((prev) => {
        // Defensive deduplication.
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
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      requestInProgress.current = false;
      setLoading(false);
    }
  }, []);

  // Initial feed request.
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Fetch another page when the sentinel enters the viewport.
  useEffect(() => {
    if (inView && hasMore && !loading && !error) {
      fetchPosts();
    }
  }, [inView, hasMore, loading, error, fetchPosts]);

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
        error instanceof Error ? error.message : "Something went wrong"
      );
    }
  }

  // Initial loading state only.
  if (loading && posts.length === 0) {
    return (
      <main className="p-10 text-center">
        Loading posts...
      </main>
    );
  }

  if (error && posts.length === 0) {
    return (
      <main className="p-10 text-center">
        <p>{error}</p>
        <button
          type="button"
          onClick={fetchPosts}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg"
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
                username={currentUsername}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {/* IntersectionObserver sentinel */}
          <div
            ref={observerRef}
            className="h-20 flex items-center justify-center"
          >
            {loading && <p>Loading more posts...</p>}

            {!hasMore && (
              <p className="text-gray-500">
                You&apos;ve reached the end!
              </p>
            )}

            {error && (
              <button
                type="button"
                onClick={fetchPosts}
                className="text-blue-600"
              >
                Failed to load. Try again
              </button>
            )}
          </div>
        </>
      )}
    </main>);
}