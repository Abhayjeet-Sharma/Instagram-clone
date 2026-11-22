import { createHash } from "crypto";
import { Socket } from "socket.io";
import pool from "./db";

const SESSION_COOKIE_NAME = "session";

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function getCookie(cookieHeader: string, name: string): string | null {
  const cookies = cookieHeader.split(";");

  for (const cookie of cookies) {
    const [key, ...value] = cookie.trim().split("=");

    if (key === name) {
      return decodeURIComponent(value.join("="));
    }
  }

  return null;
}

export async function authenticateSocket(socket: Socket) {
  const cookieHeader = socket.handshake.headers.cookie;

  if (!cookieHeader) return null;

  const token = getCookie(cookieHeader, SESSION_COOKIE_NAME);

  if (!token) return null;

  const tokenHash = hashSessionToken(token);

  const result = await pool.query(
    `SELECT users.id
     FROM sessions
     JOIN users ON users.id = sessions.user_id
     WHERE sessions.token_hash = $1
       AND sessions.expires_at > CURRENT_TIMESTAMP`,
    [tokenHash]
  );

  if (result.rows.length === 0) return null;

  return result.rows[0].id as string;
}