"use client";

import { useEffect, useState } from "react";
import { FaRegComment } from "react-icons/fa";

interface Props {
  postId: string;
}

export default function CommentCount({ postId }: Props) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    async function fetchCount() {
      try {
        const response = await fetch(
          `/api/posts/${postId}/comment-count`
        );

        if (!response.ok) return;

        const data = await response.json();
        setCount(data.count);
      } catch (error) {
        console.error("Failed to fetch comment count:", error);
      }
    }

    fetchCount();
  }, [postId]);

  return (
      <div className="flex items-center gap-3 mt-4 flex-col">
        <button
          className="text-3xl disabled:opacity-50 transition-transform active:scale-90"
        >
          <span >
            <FaRegComment /> 
          </span>
        </button>
  
        <span className="text-sm text-gray-600">
          {count} {count === 1 ? "comment" : "comments"}
        </span>
  
      </div>);
}
