
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

interface Props {
  params: Promise<{ id: string }>;
}

// GET: Check whether the current user saved this post
export async function GET(
  _request: Request,
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

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const result = await pool.query(
      `SELECT EXISTS (
        SELECT 1
        FROM saved_posts
        WHERE post_id = $1 AND user_id = $2
      ) AS saved`,
      [id, user.id]
    );

    return NextResponse.json({
      saved: result.rows[0].saved
    });

  } catch (error) {
    console.error("Get saved status error:", error);

    return NextResponse.json(
      { error: "Failed to check saved status" },
      { status: 500 }
    );
  }
}

// POST: Save a post
export async function POST(
  _request: Request,
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

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const result = await pool.query(
      `INSERT INTO saved_posts (user_id, post_id)
       SELECT $1, id
       FROM posts
       WHERE id = $2
       ON CONFLICT (user_id, post_id) DO NOTHING
       RETURNING post_id`,
      [user.id, id]
    );

    if (result.rowCount === 0) {
      // Either the post doesn't exist or it was already saved.
      const postExists = await pool.query(
        `SELECT EXISTS (
          SELECT 1 FROM posts WHERE id = $1
        ) AS exists`,
        [id]
      );

      if (!postExists.rows[0].exists) {
        return NextResponse.json(
          { error: "Post not found" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      saved: true
    });

  } catch (error) {
    console.error("Save post error:", error);

    return NextResponse.json(
      { error: "Failed to save post" },
      { status: 500 }
    );
  }
}

// DELETE: Unsave a post
export async function DELETE(
  _request: Request,
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

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const result = await pool.query(
      `DELETE FROM saved_posts
       WHERE user_id = $1 AND post_id = $2
       RETURNING post_id`,
      [user.id, id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Post was not saved or does not exist" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      saved: false
    });

  } catch (error) {
    console.error("Unsave post error:", error);

    return NextResponse.json(
      { error: "Failed to unsave post" },
      { status: 500 }
    );
  }
}
