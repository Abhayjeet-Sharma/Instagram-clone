"use client";
import { useState, useEffect } from "react";
import LikeButton from "../post/[id]/image/LikeButton";
import Link from "next/link";
import CommentCount from "./CommentCount";
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
interface Props {
  reel: Reel;
}

export default function Vidreels({ reel }: Props) {
  return (
    <div key={reel.id} className="border rounded-xl overflow-hidden shadow-sm">
      <Link href={`/post/${reel.id}/image`}>
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
          </p></div>
      </Link>

      <div className=" flex justify-between">
        <LikeButton postId={reel.id} />
        <Link href={`/post/${reel.id}/image`}>
          <CommentCount postId={reel.id} />
        </Link>
        <p className="text-sm text-gray-500 mt-2">
          {new Date(reel.created_at).toLocaleString()}
        </p>
      </div>
      <p className="font-medium break-words">{reel.caption}</p>
    </div>
  );
}
