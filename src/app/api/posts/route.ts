
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

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT *
      FROM posts
      ORDER BY created_at DESC
    `);

    return NextResponse.json({
      success: true,
      posts: result.rows,
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
