
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

interface Props {
  params: Promise<{
    id: string;
    commentId: string;
  }>;
}

function isValidId(id: string) {
  return /^[1-9]\d*$/.test(id);
}

export async function DELETE(
  request: Request,
  { params }: Props
) {
  // 1. Check authentication
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Please log in to delete comments" },
      { status: 401 }
    );
  }

  // 2. Get and validate IDs
  const { id, commentId } = await params;

  if (!isValidId(id) || !isValidId(commentId)) {
    return NextResponse.json(
      { error: "Invalid post or comment ID" },
      { status: 400 }
    );
  }

  try {
    // 3. Delete only if the comment belongs to this user
    // and belongs to the specified post.
    const result = await pool.query(
      `DELETE FROM comments
       WHERE id = $1
         AND post_id = $2
         AND user_id = $3
       RETURNING id`,
      [commentId, id, user.id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Comment not found or you don't own it" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      deletedCommentId: result.rows[0].id,
    });
  } catch (error) {
    console.error("Delete comment error:", error);

    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}
