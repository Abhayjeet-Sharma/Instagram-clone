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
    <section className="w-full max-w-xl mt-8">
      <h2 className="text-xl font-semibold mb-4">
        Comments ({comments.length})
      </h2>

      {loading ? (
        <p className="text-gray-500">Loading comments...</p>
      ) : (
        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="border-b pb-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm">@{comment.username}</p>

                  {user?.id === comment.user_id && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="text-red-500 text-xs hover:text-red-700"
                    >
                      Delete
                    </button>
                  )}
                </div>

                <p className="text-gray-700 mt-1 whitespace-pre-wrap break-words">
                  {comment.content}
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  {new Date(comment.created_at).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      <div className="mt-6">
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
