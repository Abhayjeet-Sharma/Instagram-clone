
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await pool.query(
      `SELECT
        c.id AS conversation_id,
        u.id AS other_user_id,
        u.username,
        u.display_name,
        u.profile_picture_type,
        latest.content AS last_message,
        latest.created_at AS last_message_at,
        (
          SELECT COUNT(*)
          FROM messages m
          WHERE m.conversation_id = c.id
          AND m.sender_id != $1
          AND m.is_read = false
        ) AS unread_count
      FROM conversations c
      JOIN users u ON u.id = CASE
        WHEN c.user1_id = $1 THEN c.user2_id
        ELSE c.user1_id
      END
      LEFT JOIN LATERAL (
        SELECT content, created_at
        FROM messages
        WHERE conversation_id = c.id
        ORDER BY created_at DESC, id DESC
        LIMIT 1
      ) latest ON true
      WHERE c.user1_id = $1 OR c.user2_id = $1
      ORDER BY latest.created_at DESC NULLS LAST`,
      [user.id]
    );

    return NextResponse.json({ conversations: result.rows });
  } catch (error) {
    console.error("Conversations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const username = body.username?.trim();

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    const otherUser = await pool.query(
      `SELECT id, username, display_name
       FROM users
       WHERE LOWER(username) = LOWER($1)`,
      [username]
    );

    if (otherUser.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const otherUserId = String(otherUser.rows[0].id);

    if (otherUserId === String(user.id)) {
      return NextResponse.json(
        { error: "You cannot message yourself" },
        { status: 400 }
      );
    }

    await pool.query(
      `INSERT INTO conversations (user1_id, user2_id)
       VALUES (
         LEAST($1::bigint, $2::bigint),
         GREATEST($1::bigint, $2::bigint)
       )
       ON CONFLICT (user1_id, user2_id) DO NOTHING`,
      [user.id, otherUserId]
    );

    const conversation = await pool.query(
      `SELECT id FROM conversations
       WHERE user1_id = LEAST($1::bigint, $2::bigint)
       AND user2_id = GREATEST($1::bigint, $2::bigint)`,
      [user.id, otherUserId]
    );

    return NextResponse.json({
      conversation: {
        id: conversation.rows[0].id,
        otherUser: otherUser.rows[0],
      },
    });
  } catch (error) {
    console.error("Create conversation error:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
