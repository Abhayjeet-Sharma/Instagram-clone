"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import Reels from "./components/Reels";

interface Post {
  id: string;
  caption: string;
  image_type: string;
  image_size: string;
  created_at: string;
}
interface Reel {
  id: string;
  user_id: string;
  caption: string | null;
  video_url: string;
  thumbnail_url: string | null;
  video_type: string;
  video_size: string;
  duration_seconds: string;
  views_count: string;
  created_at: string;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reels, setReels] = useState<Reel[]>([]);
const [reelsLoading, setReelsLoading] = useState(true);

async function fetchReels() {
  try {
    const response = await fetch("/api/reels", {
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch reels");
    }

    setReels(data.reels);
  } catch (error) {
    console.error("Fetch reels error:", error);
  } finally {
    setReelsLoading(false);
  }
}
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
    fetchReels();
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
              <div key={post.id}><Reels post={post}/> 
              <button
                    onClick={() => handleDelete(post.id)}
                    className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                  >
                    Delete
                  </button></div>
            ))}
          </div>
        )}
        {/* Reels Section */}
<section className="mb-10">
  <h2 className="text-xl font-semibold mb-4">Reels</h2>

  {reelsLoading ? (
    <p>Loading reels...</p>
  ) : reels.length === 0 ? (
    <p className="text-gray-500">No reels uploaded yet.</p>
  ) : (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {reels.map((reel) => (
        <div key={reel.id} className="border rounded-lg p-3">
          <video
            src={reel.video_url}
            poster={reel.thumbnail_url || undefined}
            controls
            playsInline
            preload="metadata"
            className="w-full aspect-[9/16] object-contain bg-black rounded-lg"
          />

          <p className="mt-2">{reel.caption}</p>

          <p className="text-sm text-gray-500">
            Duration: {reel.duration_seconds}s
          </p>
        </div>
      ))}
    </div>
  )}
</section>
      </main>
    </div>
  );
}
