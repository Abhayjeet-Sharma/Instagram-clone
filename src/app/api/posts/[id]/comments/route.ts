import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

interface Props {
  params: Promise<{ id: string }>;
}

function isValidId(id: string) {
  return /^[1-9]\d*$/.test(id);
}

// GET comments for a post
export async function GET(
  request: NextRequest,
  { params }: Props
) {
  const { id } = await params;

  if (!isValidId(id)) {
    return NextResponse.json(
      { error: "Invalid post ID" },
      { status: 400 }
    );
  }

  try {
    const result = await pool.query(
      `SELECT
         comments.id,
         comments.content,
         comments.created_at,
         users.id AS user_id,
         users.username
       FROM comments
       JOIN users ON users.id = comments.user_id
       WHERE comments.post_id = $1
       ORDER BY comments.created_at ASC`,
      [id]
    );

    return NextResponse.json({ comments: result.rows });
  } catch (error) {
    console.error("Fetch comments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST a new comment
export async function POST(
  request: NextRequest,
  { params }: Props
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Please log in to comment" },
      { status: 401 }
    );
  }

  const { id } = await params;

  if (!isValidId(id)) {
    return NextResponse.json(
      { error: "Invalid post ID" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const content =
      typeof body.content === "string" ? body.content.trim() : "";

    if (!content || content.length > 1000) {
      return NextResponse.json(
        { error: "Comment must contain 1-1000 characters" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO comments (post_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, content, created_at`,
      [id, user.id, content]
    );

    return NextResponse.json(
      {
        comment: {
          ...result.rows[0],
          user_id: user.id,
          username: user.username,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create comment error:", error);

    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}