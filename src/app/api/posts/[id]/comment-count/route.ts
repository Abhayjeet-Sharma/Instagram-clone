import { NextResponse } from "next/server";
import pool from "@/lib/db";

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: Request,
  { params }: Props
) {
  try {
    const { id } = await params;

    // Validate post ID
    if (!/^[1-9]\d*$/.test(id)) {
      return NextResponse.json(
        { error: "Invalid post ID" },
        { status: 400 }
      );
    }

    // Check whether post exists and fetch comment count
    const result = await pool.query(
      `SELECT COUNT(c.id)::int AS count
       FROM posts p
       LEFT JOIN comments c ON c.post_id = p.id
       WHERE p.id = $1
       GROUP BY p.id`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      count: result.rows[0].count
    });

  } catch (error) {
    console.error("Comment count error:", error);

    return NextResponse.json(
      { error: "Failed to fetch comment count" },
      { status: 500 }
    );
  }
}
