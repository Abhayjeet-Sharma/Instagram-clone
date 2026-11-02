import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!/^[1-9]\d*$/.test(id)) {
      return NextResponse.json(
        { error: "Invalid post ID" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `SELECT image_data, image_type
       FROM posts
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Post image not found" },
        { status: 404 }
      );
    }

    const { image_data, image_type } = result.rows[0];

    return new Response(
      new Uint8Array(image_data),
      {
        headers: {
          "Content-Type": image_type,
          "Content-Length": String(image_data.length),
          "Cache-Control": "private, max-age=3600",
          "X-Content-Type-Options": "nosniff",
        },
      }
    );

  } catch (error) {
    console.error("Image retrieval error:", error);

    return NextResponse.json(
      { error: "Failed to retrieve image" },
      { status: 500 }
    );
  }
}
