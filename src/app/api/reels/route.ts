import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import cloudinary from "@/lib/cloudinary";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { public_id, caption } = await request.json();

    if (!public_id || typeof public_id !== "string") {
      return NextResponse.json(
        { error: "Invalid video" },
        { status: 400 }
      );
    }

    // Replace this with your existing session authentication.
    const userId = await getCurrentUser();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify that the asset exists in Cloudinary.
    const video = await cloudinary.api.resource(
  public_id,
  {
    resource_type: "video",
    media_metadata: true,
  }
);
console.log("CLOUDINARY VIDEO:", {
  public_id: video.public_id,
  duration: video.duration,
  format: video.format,
  bytes: video.bytes,
  secure_url: video.secure_url,
});if (
  typeof video.duration !== "number" ||
  !Number.isFinite(video.duration) ||
  video.duration <= 0 ||
  video.duration > 180
) {
  return NextResponse.json(
    { error: "Invalid or unavailable video duration" },
    { status: 400 }
  );
}

    const result = await pool.query(
      `INSERT INTO reels (
        user_id,
        caption,
        video_url,
        storage_public_id,
        video_type,
        video_size,
        duration_seconds
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        userId.id,
        caption || null,
        video.secure_url,
        video.public_id,
        video.format,
        video.bytes,
        video.duration,
      ]
    );

    return NextResponse.json(
      { reel: result.rows[0] },
      { status: 201 }
    );

  } catch (error) {
    console.error("Reel creation error:", error);

    return NextResponse.json(
      { error: "Failed to create Reel" },
      { status: 500 }
    );
  }
}
export async function GET() {
  try {
    const result = await pool.query(
      `SELECT
        id,
        user_id,
        caption,
        video_url,
        video_type,
        duration_seconds,
        views_count,
        created_at
       FROM reels
       ORDER BY created_at DESC
       LIMIT 20`
    );

    return NextResponse.json({
      reels: result.rows,
    });

  } catch (error) {
    console.error("Fetch reels error:", error);

    return NextResponse.json(
      { error: "Failed to fetch reels" },
      { status: 500 }
    );
  }
}