"use client";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  username: string;
}

interface Props {
  postId: string;
}

export default function Comments({ postId }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [user, setUser] = useState<{
    id: string;
    username: string;
  } | null>(null);
  const [content, setContent] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete(commentId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this comment?",
    );

    if (!confirmed) return;

    setError("");

    try {
      const response = await fetch(
        `/api/posts/${postId}/comments/${commentId}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete comment");
      }

      // Remove the deleted comment from the UI.
      setComments((previous) =>
        previous.filter((comment) => comment.id !== commentId),
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    }
  }

  useEffect(() => {
    async function loadComments() {
      try {
        const [commentsResponse, authResponse] = await Promise.all([
          fetch(`/api/posts/${postId}/comments`),
          fetch("/api/auth/me"),
        ]);

        if (!commentsResponse.ok) {
          throw new Error("Failed to load comments");
        }

        const commentsData = await commentsResponse.json();
        const authData = authResponse.ok
          ? await authResponse.json()
          : { authenticated: false };

        setComments(commentsData.comments);
        setAuthenticated(authData.authenticated);
        setUser(authData.authenticated ? (authData.user ?? authData) : null);
      } catch (error) {
        console.error("Load comments error:", error);
        setError("Unable to load comments");
      } finally {
        setLoading(false);
      }
    }

    loadComments();
  }, [postId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmedContent = content.trim();

    if (!trimmedContent || submitting) return;

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: trimmedContent }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setAuthenticated(false);
          throw new Error("Please log in to comment");
        }

        throw new Error(data.error || "Failed to add comment");
      }

      setComments((previous) => [...previous, data.comment]);
      setContent("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="h-full min-h-0 w-full flex flex-col bg-[#121212] text-white">
      {/* Scrollable comments area */}
<div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4">
  {loading ? (
    <p className="text-sm text-gray-500 text-center py-6">
      Loading comments...
    </p>
  ) : comments.length === 0 ? (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <p className="text-sm font-semibold">No comments yet</p>
      <p className="text-xs text-gray-500 mt-1">
        Start the conversation.
      </p>
    </div>
  ) : (
    <div className="space-y-5">
      {comments.map((comment) => (
        <div key={comment.id} className="flex gap-3">
          <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[1px]">
            <div className="w-full h-full rounded-full bg-[#242424] flex items-center justify-center text-xs font-semibold">
              {comment.username?.[0]?.toUpperCase() ?? "U"}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm break-all">
                <span className="font-semibold mr-2">
                  @{comment.username}
                </span>
                <span className="text-gray-200 whitespace-pre-wrap break-words">
                  {comment.content}
                </span>
              </p>

              {user?.id === comment.user_id && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="shrink-0 text-xs text-gray-500 hover:text-red-400"
                >
                  Delete
                </button>
              )}
            </div>

            <p className="text-[11px] text-gray-500 mt-1">
              {new Date(comment.created_at).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  )}
</div>
      

      <div className="sticky bottom-0 mt-auto bg-[#121212] p-3 border-t border-[#262626]">
        {authenticated ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write a comment..."
              maxLength={1000}
              rows={3}
              required
              className="w-full border rounded-lg p-3 resize-none"
            />

            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">
                {content.length}/1000
              </span>

              <button
                type="submit"
                disabled={submitting || !content.trim()}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg disabled:opacity-50"
              >
                {submitting ? "Posting..." : "Post comment"}
              </button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-gray-500">
            <Link href="/login" className="text-blue-600 hover:underline">
              Log in
            </Link>{" "}
            to write a comment.
          </p>
        )}

        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
      </div>
    </section>
  );
}
