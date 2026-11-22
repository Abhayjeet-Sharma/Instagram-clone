
import { Server } from "socket.io";
import { authenticateSocket } from "./auth";
import pool from "./db";

export function initializeSocket(io: Server) {
  io.use(async (socket, next) => {
    try {
      const userId = await authenticateSocket(socket);

      if (!userId) {
        return next(new Error("Unauthorized"));
      }

      socket.data.userId = String(userId);
      next();
    } catch (error) {
      console.error("Socket authentication error:", error);
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;

    console.log("Authenticated user connected:", userId);

    socket.join(`user:${userId}`);

    socket.on("join_conversation", async (conversationId: string) => {
      try {
        const check = await pool.query(
          `SELECT id FROM conversations
           WHERE id = $1
           AND (user1_id = $2 OR user2_id = $2)`,
          [conversationId, userId]
        );

        if (check.rows.length === 0) {
          socket.emit("error_message", "Unauthorized conversation");
          return;
        }

        socket.join(`conversation:${conversationId}`);
      } catch (error) {
        console.error(error);
      }
    });

    socket.on("send_message", async (data: {
      conversationId: string;
      content: string;
    }) => {
      try {
        const conversationId = String(data.conversationId);
        const content = data.content?.trim();

        if (!content || content.length > 5000) return;

        const check = await pool.query(
          `SELECT id FROM conversations
           WHERE id = $1
           AND (user1_id = $2 OR user2_id = $2)`,
          [conversationId, userId]
        );

        if (check.rows.length === 0) return;

        const result = await pool.query(
          `INSERT INTO messages (conversation_id, sender_id, content)
           VALUES ($1, $2, $3)
           RETURNING id, conversation_id, sender_id, content, is_read, created_at`,
          [conversationId, userId, content]
        );

        io.to(`conversation:${conversationId}`).emit(
          "receive_message",
          result.rows[0]
        );
      } catch (error) {
        console.error("Send message error:", error);
        socket.emit("error_message", "Message could not be sent");
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", userId);
    });
  });
}
