import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import pool from "@/lib/db";
import { createSession, SESSION_COOKIE_NAME } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { email, password } = body;

    // Validate input types
    if (typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    // Find user by email
    const result = await pool.query(
      `SELECT id, username, email, password_hash
       FROM users
       WHERE LOWER(email) = LOWER($1)`,
      [normalizedEmail],
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const user = result.rows[0];

    // Compare submitted password with stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const { token, expiresAt } = await createSession(user.id);

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      { error: "Something went wrong during login" },
      { status: 500 },
    );
  }
}
