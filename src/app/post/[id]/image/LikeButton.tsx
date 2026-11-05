"use client";

import { useEffect, useState } from "react";

interface Props {
  postId: string;
}

export default function LikeButton({ postId }: Props) {
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch current user's authentication and like status
  useEffect(() => {
    async function fetchLikes() {
      try {
        const [authResponse, likesResponse] = await Promise.all([
          fetch("/api/auth/me"),
          fetch(`/api/posts/${postId}/likes`),
        ]);

        const authData = authResponse.ok
          ? await authResponse.json()
          : { authenticated: false };

        const likesData = await likesResponse.json();

        if (!likesResponse.ok) {
          throw new Error("Failed to fetch likes");
        }

        setAuthenticated(authData.authenticated);
        setLikeCount(likesData.likeCount);
        setIsLiked(authData.authenticated && likesData.isLiked);
      } catch (error) {
        console.error("Fetch likes error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchLikes();
  }, [postId]);

  async function handleLike() {
    if (!authenticated || loading) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/posts/${postId}/likes`, {
        method: isLiked ? "DELETE" : "POST",
      });

      if (!response.ok) {
        if (response.status === 401) {
          setAuthenticated(false);
          throw new Error("Please log in to like posts");
        }

        throw new Error("Failed to update like");
      }

      setIsLiked((previous) => !previous);
      setLikeCount((count) => count + (isLiked ? -1 : 1));
    } catch (error) {
      console.error("Like error:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3 mt-4">
      <button
        onClick={handleLike}
        disabled={loading || !authenticated}
        aria-label={isLiked ? "Unlike post" : "Like post"}
        title={!authenticated ? "Log in to like posts" : ""}
        className="text-3xl disabled:opacity-50 transition-transform active:scale-90"
      >
        <span className={isLiked ? "text-red-500" : "text-gray-500"}>
          {isLiked ? "♥" : "♡"}
        </span>
      </button>

      <span className="text-sm text-gray-600">
        {likeCount} {likeCount === 1 ? "like" : "likes"}
      </span>

      {!authenticated && !loading && (
        <span className="text-xs text-gray-500">
          Log in to like
        </span>
      )}
    </div>
  );
}