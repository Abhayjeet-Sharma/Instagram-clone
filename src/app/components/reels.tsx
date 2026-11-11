"use client";
import { useState, useEffect } from "react";
import LikeButton from "../post/[id]/image/LikeButton";
import Link from "next/link";
import CommentCount from "./CommentCount";
interface Post {
  id: string;
  caption: string;
  image_type: string;
  image_size: string;
  created_at: string;
}
interface Props {
  post: Post;
}

export default function Reels({ post }: Props) {
  return (
    <div key={post.id} className="border rounded-xl overflow-hidden shadow-sm">
      <Link href={`/post/${post.id}/image`}>
        <img
          src={`/api/posts/${post.id}/image`}
          alt={post.caption || "Instagram post"}
          className="w-full aspect-square object-cover cursor-pointer"
        />
      </Link>

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
