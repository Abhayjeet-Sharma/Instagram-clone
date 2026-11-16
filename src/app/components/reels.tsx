"use client";
import { useState, useEffect } from "react";
import LikeButton from "../post/[id]/image/LikeButton";
import Link from "next/link";
import CommentCount from "./CommentCount";
export interface Post {
  id: string;
  user_id: string;
  caption: string | null;
  content_type: "image" | "video";

  // Image fields
  image_type: string | null;
  image_size: string | null;

  // Video fields
  video_url: string | null;
  thumbnail_url: string | null;
  video_type: string | null;
  video_size: string | null;
  duration_seconds: string | null;
  views_count: string;

  created_at: string;
  updated_at: string;
}
interface Props {
  post: Post;
}

export default function Reels({ post }: Props) {
  return (
    <div key={post.id} className="border rounded-xl overflow-hidden shadow-sm">
      {post.content_type === "video"?
      <Link href={`/post/${post.id}/image`}>
        <div key={post.id} className="border rounded-lg p-3">
          <video
            src={post.video_url || undefined}
            poster={post.thumbnail_url || undefined}
            controls
            playsInline
            preload="metadata"
            className="w-full aspect-[9/16] object-contain bg-black rounded-lg"
          />

          <p className="mt-2">{post.caption}</p>

          <p className="text-sm text-gray-500">
            Duration: {post.duration_seconds}s
          </p></div>
      </Link>:
      <Link href={`/post/${post.id}/image`}>
        <img
          src={`/api/posts/${post.id}/image`}
          alt={post.caption || "Instagram post"}
          className="w-full aspect-square object-cover cursor-pointer"
        />
      </Link>}

      <div className=" flex justify-between">
        <LikeButton postId={post.id} />
        <Link href={`/post/${post.id}/image`}>
          <CommentCount postId={post.id} />
        </Link>
        <p className="text-sm text-gray-500 mt-2">
          {new Date(post.created_at).toLocaleString()}
        </p>
      </div>
      <p className="font-medium break-words">{post.caption}</p>
    </div>
  );
}
