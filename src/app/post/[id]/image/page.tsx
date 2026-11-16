
import { notFound } from "next/navigation";
import Link from "next/link";
import pool from "@/lib/db";

import LikeButton from "./LikeButton";
import Comments from "./Comments";
import SaveButton from "./SaveButton";

export const instant = false;

interface Props {
  params: Promise<{ id: string }>;
}

interface Post {
  id: string;
  content_type: "image" | "video";
  video_url: string | null;
  caption: string | null;
}

export default async function PostPage({ params }: Props) {
  const { id } = await params;

  if (!/^[1-9]\d*$/.test(id)) {
    notFound();
  }

  const result = await pool.query<Post>(
    `SELECT id, content_type, video_url, caption
     FROM posts
     WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    notFound();
  }

  const post = result.rows[0];

  if (post.content_type === "video" && !post.video_url) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-black text-white px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">

        {/* Back Navigation */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
          >
            <span className="text-lg">←</span>
            Back to feed
          </Link>
        </div>

        {/* Post Container */}
        <div className="mx-auto max-w-2xl overflow-hidden rounded-xl border border-gray-800 bg-[#111111] shadow-2xl">

          {/* Post Header */}
          <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-white">
                Post #{post.id}
              </p>
              <p className="text-xs text-gray-500">
                {post.content_type === "image" ? "Photo" : "Video"}
              </p>
            </div>

            <span className="rounded-full bg-gray-800 px-3 py-1 text-xs text-gray-300">
              {post.content_type === "image" ? "IMAGE" : "REEL"}
            </span>
          </div>

          {/* Media */}
          <div className="flex w-full items-center justify-center bg-black">
            {post.content_type === "image" ? (
              <img
                src={`/api/posts/${id}/image`}
                alt={post.caption || `Post ${id}`}
                className="max-h-[75vh] w-full object-contain"
              />
            ) : (
              <video
                src={post.video_url!}
                controls
                playsInline
                preload="metadata"
                className="max-h-[75vh] w-full object-contain"
              />
            )}
          </div>

          {/* Caption */}
          {post.caption && (
            <div className="border-b border-gray-800 px-4 py-4">
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-200">
                {post.caption}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-5 border-b border-gray-800 px-4 py-4">
            <LikeButton postId={id} />
            <SaveButton postId={id} />
          </div>

          {/* Comments */}
          <div className="px-4 py-5">
            <h2 className="mb-4 text-base font-semibold text-white">
              Comments
            </h2>
            <Comments postId={id} />
          </div>

        </div>
      </div>
    </main>
  );
}
