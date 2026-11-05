import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

interface Props {
  params: Promise<{ id: string }>;
}

// GET: Fetch like count and current user's like status
export async function GET(
  request: NextRequest,
  { params }: Props
) {
  try {
    const { id } = await params;

    if (!/^[1-9]\d*$/.test(id)) {
      return NextResponse.json(
        { error: "Invalid post ID" },
        { status: 400 }
      );
    }

    const user = await getCurrentUser();

    const result = await pool.query(
      `SELECT
          p.id,
          COUNT(l.user_id)::int AS like_count,
          COALESCE(
            BOOL_OR(l.user_id = $2::bigint),
            false
          ) AS is_liked
       FROM posts p
       LEFT JOIN likes l ON l.post_id = p.id
       WHERE p.id = $1
       GROUP BY p.id`,
      [id, user?.id ?? null]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      likeCount: result.rows[0].like_count,
      isLiked: result.rows[0].is_liked,
    });
  } catch (error) {
    console.error("Fetch likes error:", error);

    return NextResponse.json(
      { error: "Failed to fetch likes" },
      { status: 500 }
    );
  }
}

// POST: Like a post
export async function POST(
  request: NextRequest,
  { params }: Props
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!/^[1-9]\d*$/.test(id)) {
      return NextResponse.json(
        { error: "Invalid post ID" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO likes (post_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (post_id, user_id) DO NOTHING
       RETURNING post_id`,
      [id, user.id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({
        success: true,
        liked: true,
        alreadyLiked: true,
      });
    }

    return NextResponse.json({
      success: true,
      liked: true,
      alreadyLiked: false,
    });
  } catch (error) {
    console.error("Like post error:", error);

    return NextResponse.json(
      { error: "Failed to like post" },
      { status: 500 }
    );
  }
}

// DELETE: Unlike a post
export async function DELETE(
  request: NextRequest,
  { params }: Props
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!/^[1-9]\d*$/.test(id)) {
      return NextResponse.json(
        { error: "Invalid post ID" },
        { status: 400 }
      );
    }

    await pool.query(
      `DELETE FROM likes
       WHERE post_id = $1 AND user_id = $2`,
      [id, user.id]
    );

    return NextResponse.json({
      success: true,
      liked: false,
    });
  } catch (error) {
    console.error("Unlike post error:", error);

    return NextResponse.json(
      { error: "Failed to unlike post" },
      { status: 500 }
    );
  }
}