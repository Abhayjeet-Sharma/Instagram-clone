import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import pool from "@/lib/db";

const SALT_ROUNDS = 12;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { username, email, password } = body;

    // Basic input validation
    if (
      typeof username !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      );
    }

    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[A-Za-z0-9._]{3,30}$/.test(normalizedUsername)) {
      return NextResponse.json(
        { error: "Username must be 3-30 characters and contain only letters, numbers, dots, and underscores" },
        { status: 400 }
      );
    }

    if (
      normalizedEmail.length > 255 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    if (password.length < 8 || password.length > 72) {
      return NextResponse.json(
        { error: "Password must be between 8 and 72 characters" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Insert user into PostgreSQL
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, created_at`,
      [normalizedUsername, normalizedEmail, passwordHash]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully",
        user: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error: any) {
    // PostgreSQL unique constraint violation
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Username or email already exists" },
        { status: 409 }
      );
    }

    console.error("Registration error:", error);

    return NextResponse.json(
      { error: "Something went wrong during registration" },
      { status: 500 }
    );
  }
}