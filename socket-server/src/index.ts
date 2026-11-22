
import express from "express";
import http from "http";
import cors from "cors";
import "dotenv/config";
import { Server } from "socket.io";
import pool from "./db";
import { initializeSocket } from "./socket";

const app = express();

const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
}));

app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    credentials: true,
  },
});

initializeSocket(io);

app.get("/", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      message: "Socket server running!",
      database: "Connected",
      socket: "Ready",
    });
  } catch {
    res.status(500).json({
      message: "Database connection failed",
    });
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
