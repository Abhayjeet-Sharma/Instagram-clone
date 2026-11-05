import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import pool from "@/lib/db";
import {
  hashSessionToken,
  SESSION_COOKIE_NAME,
} from "@/lib/session";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (token) {
      const tokenHash = hashSessionToken(token);

      await pool.query(
        `DELETE FROM sessions
         WHERE token_hash = $1`,
        [tokenHash]
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });

    response.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(0),
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);

    return NextResponse.json(
      { error: "Logout failed" },
      { status: 500 }
    );
  }
}