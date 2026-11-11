"use client";

import { useEffect, useState } from "react";

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

  return <span>💬 {count}</span>;
}
