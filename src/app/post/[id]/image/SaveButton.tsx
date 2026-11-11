"use client";

import { useEffect, useState } from "react";

interface Props {
  postId: string;
}

export default function SaveButton({ postId }: Props) {
  const [saved, setSaved] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSavedStatus() {
      try {
        const response = await fetch(
          `/api/posts/${postId}/saved`
        );

        if (response.status === 401) {
          setAuthenticated(false);
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to load saved status");
        }

        const data = await response.json();

        setAuthenticated(true);
        setSaved(data.saved);
      } catch (error) {
        console.error(error);
        setError("Unable to load saved status");
      } finally {
        setLoading(false);
      }
    }

    loadSavedStatus();
  }, [postId]);

  async function handleSave() {
    if (!authenticated || loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/posts/${postId}/saved`,
        {
          method: saved ? "DELETE" : "POST"
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update saved status");
      }

      setSaved(data.saved);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <p>Loading save status...</p>;
  }

  return (
    <div className="mt-3">
      <button
        onClick={handleSave}
        disabled={!authenticated || loading}
        className="rounded-lg border px-4 py-2 hover:bg-gray-100 disabled:opacity-50"
      >
        {saved ? "🔖 Saved" : "🔖 Save"}
      </button>

      {!authenticated && (
        <p className="text-sm text-gray-500 mt-2">
          Log in to save posts.
        </p>
      )}

      {error && (
        <p className="text-sm text-red-500 mt-2">
          {error}
        </p>
      )}
    </div>
  );
}
