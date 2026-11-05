"use client";
import Image from "next/image";
import Story from "./UI/story";
import Reel from "./UI/reels";
import { useEffect, useState } from "react";

interface Post {
  id: string;
  caption: string;
  image_type: string;
  image_size: string;
  created_at: string;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this post?",
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

      setPosts((currentPosts) => currentPosts.filter((post) => post.id !== id));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Something went wrong");
    }
  }
  async function fetchPosts() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/posts", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch posts");
      }

      setPosts(data.posts);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPosts();
  }, []);

  if (loading) {
    return <main className="p-10 text-center">Loading posts...</main>;
  }

  if (error) {
    return (
      <main className="p-10 text-center">
        <p>{error}</p>
        <button onClick={fetchPosts}>Try again</button>
      </main>
    );
  }
  return (
    <div>
      {/* <div className="fixed top-0 flex p-4 gap-8 border border-gray-200 bg-white">
        {Array.from({ length: 12 }).map((_, index) => (
          <Story key={index} />
        ))}
      </div> */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Instagram Clone</h1>

          <a
            href="/upload"
            className="bg-blue-600 text-white px-5 py-2 rounded-lg"
          >
            Create Post
          </a>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-xl font-semibold">No posts yet</h2>
            <p className="text-gray-500 mt-2">
              Upload your first image to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="border rounded-xl overflow-hidden shadow-sm"
              >
                <a href={`/post/${post.id}/image`}>
                  <img
                    src={`/api/posts/${post.id}/image`}
                    alt={post.caption || "Instagram post"}
                    className="w-full aspect-square object-cover cursor-pointer"
                  />
                </a>

                <div className="p-4">
                  <p className="font-medium break-words">{post.caption}</p>

                  <p className="text-sm text-gray-500 mt-2">
                    {new Date(post.created_at).toLocaleString()}
                  </p>

                  <button
                    onClick={() => handleDelete(post.id)}
                    className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
