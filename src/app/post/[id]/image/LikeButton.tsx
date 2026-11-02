"use client";

import { useEffect, useState } from "react";
import { getClientId } from "@/lib/client-id";

interface Props {
  postId: string;
}

export default function LikeButton({ postId }: Props) {
  const [clientId, setClientId] = useState("");
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);

  // Get browser identity and fetch initial like status
  useEffect(() => {
    const id = getClientId();
    setClientId(id);

    async function fetchLikes() {
      try {
        const response = await fetch(
          `/api/posts/${postId}/likes?clientId=${id}`
        );

        if (!response.ok) throw new Error("Failed to fetch likes");

        const data = await response.json();

        setLikeCount(data.likeCount);
        setIsLiked(data.isLiked);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    fetchLikes();
  }, [postId]);

  async function handleLike() {
    if (!clientId || loading) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/posts/${postId}/likes`, {
        method: isLiked ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ clientId }),
      });

      if (!response.ok) throw new Error("Failed to update like");

      setIsLiked(!isLiked);
      setLikeCount((count) => count + (isLiked ? -1 : 1));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3 mt-4">
      <button
        onClick={handleLike}
        disabled={loading}
        aria-label={isLiked ? "Unlike post" : "Like post"}
        className="text-3xl disabled:opacity-50 transition-transform active:scale-90"
      >
        <span className={isLiked ? "text-red-500" : "text-gray-500"}>
          {isLiked ? "♥" : "♡"}
        </span>
      </button>

      <span className="text-sm text-gray-600">
        {likeCount} {likeCount === 1 ? "like" : "likes"}
      </span>
    </div>
  );
}