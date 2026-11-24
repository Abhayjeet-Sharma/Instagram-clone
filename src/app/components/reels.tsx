"use client";

import LikeButton from "../post/[id]/image/LikeButton";
import Link from "next/link";
import CommentCount from "./CommentCount";
import Comments from "../post/[id]/image/Comments";
import Image from "next/image";

export interface Post {
  id: string;
  user_id: string;
  caption: string | null;
  content_type: "image" | "video";
  image_type: string | null;
  image_size: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  video_type: string | null;
  video_size: string | null;
  duration_seconds: string | null;
  views_count: string;
  created_at: string;
  updated_at: string;
  profile_picture:String;
  profile_picture_type:String;
  username:String;
}

interface Props {
  post: Post;
  currentUserId?: string | null;
  onDelete: (id: string) => void | Promise<void>;
}

export default function Reels({ post, currentUserId, onDelete}: Props) {
  const postUrl = `/post/${post.id}/image`;
  const isOwner = Boolean(
    currentUserId && String(currentUserId) === String(post.user_id)
  );

  const formattedDate = new Date(post.created_at).toLocaleDateString(
    "en-US",
    {
      month: "long",
      day: "numeric",
      year: "numeric",
    }
  );

  return (
    <article className="w-full min-h-[calc(100svh-64px)] flex items-center justify-center px-3 sm:px-6 py-6">
      <div className="w-full max-w-[1100px] min-h-[650px] md:h-[calc(100svh-120px)] md:min-h-0 md:max-h-[850px] bg-[#121212] border border-[#262626] rounded-xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
        {/* MEDIA SECTION */}
        <div className="w-full md:w-[68%] h-[55vh] md:h-full shrink-0 bg-black flex items-center justify-center overflow-hidden">
          {post.content_type === "video" ? (
            <video
              src={post.video_url || undefined}
              poster={post.thumbnail_url || undefined}
              controls
              playsInline
              preload="metadata"
              className="w-full h-full object-contain"
            />
          ) : (
            <Link
              href={postUrl}
              className="w-full h-full flex items-center justify-center"
            >
              <img
                src={`/api/posts/${post.id}/image`}
                alt={post.caption || "Instagram post"}
                loading="lazy"
                className="w-full h-full object-contain"
              />
            </Link>
          )}
        </div>

        {/* DETAILS SECTION */}
        <div className="w-full md:w-[32%] min-w-0 min-h-0 flex-1 md:flex-none md:h-full flex flex-col bg-[#121212] text-white">
          {/* HEADER */}
          <div className="shrink-0 flex items-center justify-between px-4 py-4 border-b border-[#262626]">
            <div className="flex items-center gap-3 min-w-0">
             <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
  <div className="relative w-full h-full rounded-full bg-[#121212] overflow-hidden flex items-center justify-center">
    {post.profile_picture ? (
      <Image
        src={post.profile_picture}
        alt={`${post.username}'s profile picture`}
        fill
        unoptimized
        className="object-cover"
      />
    ) : (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 text-sm font-bold text-white">
        {post.username?.[0]?.toUpperCase()}
      </div>
    )}
  </div>
</div>

              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">
                  {post.username}
                </p>
                <p className="text-sm text-gray-300 truncate">
                  {post.caption || ""}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formattedDate}
                </p>
              </div>
            </div>

            {isOwner ? (
              <button
                type="button"
                onClick={() => onDelete(post.id)}
                className="bg-red-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            ) : (
              <button
                className="text-gray-400 hover:text-white text-xl px-2"
                aria-label="More options"
                type="button"
              >
                ···
              </button>
            )}
          </div>

          {/* COMMENTS SECTION */}
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <Comments postId={post.id} />
          </div>

          {/* ACTIONS SECTION */}
          <div className="shrink-0 border-t border-[#262626] p-4 bg-[#121212]">
            <div className="flex items-center gap-5">
              <div className="hover:scale-110 transition-transform">
                <LikeButton postId={post.id} />
              </div>

              <Link
                href={postUrl}
                className="text-gray-300 hover:text-gray-500 transition-colors"
                aria-label="View comments"
              >
                <CommentCount postId={post.id} />
              </Link>
            </div>

            <p className="text-xs text-gray-500 mt-4 uppercase tracking-wide">
              {formattedDate}
            </p>

            <Link
              href={postUrl}
              className="block mt-3 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Open post
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}