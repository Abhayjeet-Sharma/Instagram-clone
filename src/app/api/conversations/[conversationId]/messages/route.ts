
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

type Context = {
  params: Promise<{ conversationId: string }>;
};

export async function GET(
  request: NextRequest,
  { params }: Context
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { conversationId } = await params;

    const access = await pool.query(
      `SELECT id FROM conversations
       WHERE id = $1
       AND (user1_id = $2 OR user2_id = $2)`,
      [conversationId, user.id]
    );

    if (access.rows.length === 0) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const result = await pool.query(
      `SELECT
         m.id,
         m.conversation_id,
         m.sender_id,
         m.content,
         m.is_read,
         m.created_at,
         u.username,
         u.display_name
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC
       LIMIT 100`,
      [conversationId]
    );

    return NextResponse.json({
      messages: result.rows,
    });
  } catch (error) {
    console.error("Fetch messages error:", error);

    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
