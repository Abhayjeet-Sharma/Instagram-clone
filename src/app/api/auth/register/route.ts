
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import pool from "@/lib/db";
import { generateOTP, hashOTP } from "@/lib/otp";
import { sendVerificationEmail } from "@/lib/email";

const SALT_ROUNDS = 12;

export async function POST(request: NextRequest) {
  const client = await pool.connect();

  try {
    const body = await request.json();
    const { username, email, password } = body;

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
        { error: "Invalid username" },
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

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const otp = generateOTP();
    const otpHash = hashOTP(otp);

    await client.query("BEGIN");

    const result = await client.query(
      `INSERT INTO users
       (username, email, password_hash, is_verified)
       VALUES ($1, $2, $3, FALSE)
       RETURNING id, username, email`,
      [normalizedUsername, normalizedEmail, passwordHash]
    );

    const user = result.rows[0];

    await client.query(
      `INSERT INTO email_verifications
       (user_id, otp_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '10 minutes')`,
      [user.id, otpHash]
    );

    await client.query("COMMIT");

    // Send OTP after the database transaction commits
    await sendVerificationEmail(normalizedEmail, otp);

    return NextResponse.json(
      {
        success: true,
        message: "Account created. Please verify your email.",
        email: normalizedEmail,
      },
      { status: 201 }
    );

  } catch (error: any) {
    await client.query("ROLLBACK");

    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Username or email already exists" },
        { status: 409 }
      );
    }

    console.error("Registration error:", error);

    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );

  } finally {
    client.release();
  }
}
