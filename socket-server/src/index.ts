import express from "express";
import http from "http";
import cors from "cors";
import "dotenv/config";
import pool from "./db";
import { initializeSocket } from "./socket";

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));

app.use(express.json());

const server = http.createServer(app);

// Initialize Socket.IO
const io = initializeSocket(server);

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

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});