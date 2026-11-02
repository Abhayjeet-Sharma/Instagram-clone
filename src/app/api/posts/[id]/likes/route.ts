import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

interface Props {
  params: Promise<{ id: string }>;
}

function isValidUUID(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

// GET: Get like count and current browser's like status
export async function GET(
  request: NextRequest,
  { params }: Props
) {
  try {
    const { id } = await params;
    const clientId = request.nextUrl.searchParams.get("clientId");

    if (!/^[1-9]\d*$/.test(id)) {
      return NextResponse.json(
        { error: "Invalid post ID" },
        { status: 400 }
      );
    }

    if (!clientId || !isValidUUID(clientId)) {
      return NextResponse.json(
        { error: "Invalid client ID" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `SELECT
         COUNT(*) AS like_count,
         BOOL_OR(client_id = $2::uuid) AS is_liked
       FROM likes
       WHERE post_id = $1`,
      [id, clientId]
    );

    return NextResponse.json({
      success: true,
      likeCount: Number(result.rows[0].like_count),
      isLiked: result.rows[0].is_liked ?? false,
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
    const { id } = await params;
    const { clientId } = await request.json();

    if (!/^[1-9]\d*$/.test(id)) {
      return NextResponse.json(
        { error: "Invalid post ID" },
        { status: 400 }
      );
    }

    if (typeof clientId !== "string" || !isValidUUID(clientId)) {
      return NextResponse.json(
        { error: "Invalid client ID" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO likes (post_id, client_id)
       VALUES ($1, $2)
       ON CONFLICT (post_id, client_id) DO NOTHING
       RETURNING post_id`,
      [id, clientId]
    );

    return NextResponse.json({
      success: true,
      liked: true,
      alreadyLiked: result.rowCount === 0,
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
    const { id } = await params;
    const { clientId } = await request.json();

    if (!/^[1-9]\d*$/.test(id)) {
      return NextResponse.json(
        { error: "Invalid post ID" },
        { status: 400 }
      );
    }

    if (typeof clientId !== "string" || !isValidUUID(clientId)) {
      return NextResponse.json(
        { error: "Invalid client ID" },
        { status: 400 }
      );
    }

    await pool.query(
      `DELETE FROM likes
       WHERE post_id = $1 AND client_id = $2`,
      [id, clientId]
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