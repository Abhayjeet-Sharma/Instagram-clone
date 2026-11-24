
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const query = request.nextUrl.searchParams.get("q")?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    const result = await pool.query(
      `SELECT id, username, display_name
       FROM users
       WHERE id != $1
       AND (
         username ILIKE $2
         OR display_name ILIKE $2
       )
       ORDER BY username
       LIMIT 8`,
      [currentUser.id, `%${query}%`]
    );

    return NextResponse.json({ users: result.rows });
  } catch (error) {
    console.error("User search error:", error);

    return NextResponse.json(
      { error: "User search failed" },
      { status: 500 }
    );
  }
}
