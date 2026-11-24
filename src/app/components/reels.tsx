
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
  profile_picture: string;
  profile_picture_type: string;
  username: string;
}

interface Props {
  post: Post;
  currentUserId?: string | null;
  onDelete: (id: string) => void | Promise<void>;
}

export default function Reels({ post, currentUserId, onDelete }: Props) {
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
    <article className="w-full min-h-[calc(100svh-64px)] flex items-center justify-center px-3 sm:px-6 py-8">

      {/* MAIN GLASS CARD */}
      <div className="relative w-full max-w-[1100px] min-h-[650px] md:h-[calc(100svh-120px)] md:min-h-0 md:max-h-[850px] flex flex-col md:flex-row overflow-hidden rounded-3xl border border-white/10 bg-[#170e20]/65 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">

        {/* Subtle glow behind the card */}
        <div className="absolute -top-32 left-1/3 h-64 w-64 rounded-full bg-fuchsia-600/10 blur-[100px] pointer-events-none" />

        {/* MEDIA SECTION */}
        <div className="relative w-full md:w-[68%] h-[55vh] md:h-full shrink-0 bg-black/40 flex items-center justify-center overflow-hidden">

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
                alt={post.caption || "Luma post"}
                loading="lazy"
                className="w-full h-full object-contain"
              />
            </Link>
          )}
        </div>

        {/* DETAILS SECTION */}
        <div className="relative z-10 w-full md:w-[32%] min-w-0 min-h-0 flex-1 md:flex-none md:h-full flex flex-col bg-white/[0.035] text-white backdrop-blur-xl">

          {/* HEADER */}
          <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-4 border-b border-white/[0.08] bg-white/[0.025]">

            <div className="flex items-center gap-3 min-w-0">

              {/* PROFILE IMAGE */}
              <div className="w-11 h-11 shrink-0 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2px] shadow-[0_0_15px_rgba(217,70,239,0.2)]">
                <div className="relative w-full h-full rounded-full bg-[#170e20] overflow-hidden flex items-center justify-center">
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

              {/* USER DETAILS */}
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate text-white">
                  {post.username}
                </p>

                <p className="text-sm text-white/60 truncate">
                  {post.caption || ""}
                </p>

                <p className="text-xs text-white/35 mt-1">
                  {formattedDate}
                </p>
              </div>
            </div>

            {/* DELETE / MORE */}
            {isOwner ? (
              <button
                type="button"
                onClick={() => onDelete(post.id)}
                className="shrink-0 rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 transition-all hover:bg-red-500/20 hover:border-red-400/40"
              >
                Delete
              </button>
            ) : (
              <button
                className="shrink-0 rounded-full px-2 text-xl text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="More options"
                type="button"
              >
                ···
              </button>
            )}
          </div>

          {/* COMMENTS */}
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <Comments postId={post.id} />
          </div>

          {/* ACTIONS */}
          <div className="shrink-0 border-t border-white/[0.08] p-4 bg-white/[0.025]">

            <div className="flex items-center gap-5">
              <div className="hover:scale-110 transition-transform">
                <LikeButton postId={post.id} />
              </div>

              <Link
                href={postUrl}
                className="hover:scale-110 transition-transform"
                aria-label="View comments"
              >
                <CommentCount postId={post.id} />
              </Link>
            </div>

            <p className="text-xs text-white/35 mt-4 uppercase tracking-widest text-right">
              {formattedDate}
            </p>

            <Link
              href={postUrl}
              className="group flex items-center justify-center gap-2 mt-3 w-full rounded-xl border border-fuchsia-400/20 bg-gradient-to-r from-fuchsia-500/10 to-violet-500/10 py-2.5 text-sm font-medium text-fuchsia-200 transition-all duration-300 hover:border-fuchsia-400/40 hover:from-fuchsia-500/20 hover:to-violet-500/20 hover:shadow-[0_0_20px_rgba(217,70,239,0.12)]"
            >
              Open post
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
