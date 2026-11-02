import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        id,
        caption,
        image_type,
        image_size,
        created_at
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
    const formData = await request.formData();

    const caption = formData.get("caption");
    const image = formData.get("image");

    // Validate caption
    if (typeof caption !== "string") {
      return NextResponse.json(
        { error: "Invalid caption" },
        { status: 400 }
      );
    }

    // Validate image
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
      `INSERT INTO posts (caption, image_data, image_type, image_size)
       VALUES ($1, $2, $3, $4)
       RETURNING id, caption, image_type, image_size, created_at`,
      [caption, imageBuffer, image.type, image.size]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Post uploaded successfully",
        post: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Post upload error:", error);

    return NextResponse.json(
      { error: "Something went wrong while uploading the post" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (
      typeof id !== "string" ||
      !/^[1-9]\d*$/.test(id)
    ) {
      return NextResponse.json(
        { error: "Invalid post ID" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `DELETE FROM posts
       WHERE id = $1
       RETURNING id`,
      [id]
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
    });
  } catch (error) {
    console.error("Delete post error:", error);

    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}