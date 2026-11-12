
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

interface Props {
  params: Promise<{ username: string }>;
}

export async function GET(request:NextRequest,{ params }: Props) {
  try {
    const { username } = await params;

    if (!username || username.length > 30) {
      return NextResponse.json(
        { error: "Invalid username" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `SELECT id, username, display_name, bio, created_at
       FROM users
       WHERE LOWER(username) = LOWER($1)`,
      [username]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: result.rows[0],
    });

  } catch (error) {
    console.error("Fetch profile error:", error);

    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
