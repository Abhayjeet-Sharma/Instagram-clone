
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import cloudinary from "@/lib/cloudinary";
import { getCurrentUser } from "@/lib/auth";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const CLOUDINARY_FOLDER = "instagram-clone/reels";


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const limitParam = searchParams.get("limit");
    const cursorCreatedAt = searchParams.get("cursorCreatedAt");
    const cursorId = searchParams.get("cursorId");

    const limit = limitParam ? Number(limitParam) : 10;

    if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
      return NextResponse.json(
        { error: "Invalid limit" },
        { status: 400 }
      );
    }

    // Cursor parameters must be provided together.
    if (
      (cursorCreatedAt && !cursorId) ||
      (!cursorCreatedAt && cursorId)
    ) {
      return NextResponse.json(
        { error: "Invalid cursor" },
        { status: 400 }
      );
    }

    if (
      cursorId &&
      !/^[1-9]\d*$/.test(cursorId)
    ) {
      return NextResponse.json(
        { error: "Invalid cursor ID" },
        { status: 400 }
      );
    }

    if (
      cursorCreatedAt &&
      !Number.isFinite(Date.parse(cursorCreatedAt))
    ) {
      return NextResponse.json(
        { error: "Invalid cursor timestamp" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `SELECT
        id,
        user_id,
        caption,
        content_type,
        image_type,
        image_size,
        video_url,
        thumbnail_url,
        video_type,
        video_size,
        duration_seconds,
        views_count,
        created_at
      FROM posts
      WHERE
        ($1::timestamptz IS NULL OR
         (created_at, id) < ($1::timestamptz, $2::bigint))
      ORDER BY created_at DESC, id DESC
      LIMIT $3`,
      [
        cursorCreatedAt,
        cursorId,
        limit + 1
      ]
    );

    const hasMore = result.rows.length > limit;

    // Fetch one extra row to determine whether another page exists.
    const posts = result.rows.slice(0, limit);

    const lastPost = posts[posts.length - 1];

    const nextCursor =
      hasMore && lastPost
        ? {
            createdAt: lastPost.created_at,
            id: String(lastPost.id),
          }
        : null;

    return NextResponse.json({
      success: true,
      posts,
      nextCursor,
      hasMore,
    });

  } catch (error) {
    console.error("Fetch posts error:", error);

    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}


export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const contentType = request.headers.get("content-type") || "";

    // IMAGE POST: multipart/form-data
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();

      const caption = formData.get("caption");
      const image = formData.get("image");

      if (typeof caption !== "string") {
        return NextResponse.json(
          { error: "Invalid caption" },
          { status: 400 }
        );
      }

      if (!(image instanceof File)) {
        return NextResponse.json(
          { error: "Image is required" },
          { status: 400 }
        );
      }

      if (!ALLOWED_TYPES.includes(image.type)) {
        return NextResponse.json(
          { error: "Unsupported image format" },
          { status: 400 }
        );
      }

      if (image.size === 0 || image.size > MAX_IMAGE_SIZE) {
        return NextResponse.json(
          { error: "Image must be between 1 byte and 5 MB" },
          { status: 400 }
        );
      }

      const imageBuffer = Buffer.from(await image.arrayBuffer());

      const result = await pool.query(
        `INSERT INTO posts (
          user_id,
          caption,
          content_type,
          image_data,
          image_type,
          image_size
        )
        VALUES ($1, $2, 'image', $3, $4, $5)
        RETURNING id, content_type`,
        [user.id, caption, imageBuffer, image.type, image.size]
      );

      return NextResponse.json(
        {
          success: true,
          message: "Image post uploaded successfully",
          post: result.rows[0],
        },
        { status: 201 }
      );
    }

    // VIDEO POST: application/json
    if (contentType.includes("application/json")) {
      const { public_id, caption } = await request.json();

      if (
        typeof public_id !== "string" ||
        !public_id.startsWith(`${CLOUDINARY_FOLDER}/`)
      ) {
        return NextResponse.json(
          { error: "Invalid video" },
          { status: 400 }
        );
      }

      if (caption !== undefined && caption !== null &&
          typeof caption !== "string") {
        return NextResponse.json(
          { error: "Invalid caption" },
          { status: 400 }
        );
      }

      // Verify the uploaded asset with Cloudinary.
      const video = await cloudinary.api.resource(public_id, {
        resource_type: "video",
        media_metadata: true,
      });

      if (
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

      if (
        !video.secure_url ||
        !video.bytes ||
        !video.format
      ) {
        return NextResponse.json(
          { error: "Incomplete video metadata" },
          { status: 400 }
        );
      }

      const result = await pool.query(
        `INSERT INTO posts (
          user_id,
          caption,
          content_type,
          video_url,
          storage_provider,
          storage_public_id,
          video_type,
          video_size,
          duration_seconds
        )
        VALUES ($1, $2, 'video', $3, 'cloudinary', $4, $5, $6, $7)
        RETURNING id, content_type, video_url`,
        [
          user.id,
          caption ?? null,
          video.secure_url,
          video.public_id,
          video.format,
          video.bytes,
          video.duration,
        ]
      );

      return NextResponse.json(
        {
          success: true,
          message: "Video post uploaded successfully",
          post: result.rows[0],
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { error: "Unsupported request content type" },
      { status: 415 }
    );

  } catch (error) {
    console.error("Create post error:", error);

    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const { id } = await request.json();

    if (typeof id !== "string" || !/^[1-9]\d*$/.test(id)) {
      return NextResponse.json(
        { error: "Invalid post ID" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `DELETE FROM posts
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [id, user.id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      deletedId: result.rows[0].id,
      message: "Post deleted successfully",
    });

  } catch (error) {
    console.error("Delete post error:", error);

    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
