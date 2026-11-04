import { cookies } from "next/headers";
import pool from "@/lib/db";
import {
  hashSessionToken,
  SESSION_COOKIE_NAME,
} from "@/lib/session";

export interface AuthUser {
  id: string;
  username: string;
  email: string;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    // Read session cookie
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    // Hash the token to find its database record
    const tokenHash = hashSessionToken(token);

    const result = await pool.query(
      `SELECT
          users.id,
          users.username,
          users.email
       FROM sessions
       JOIN users ON users.id = sessions.user_id
       WHERE sessions.token_hash = $1
         AND sessions.expires_at > CURRENT_TIMESTAMP`,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as AuthUser;
  } catch (error) {
    console.error("Authentication error:", error);
    return null;
  }
}