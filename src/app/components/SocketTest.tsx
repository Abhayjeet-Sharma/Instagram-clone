"use client";

import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";

export default function SocketTest() {
  const [status, setStatus] = useState("Disconnected");

  useEffect(() => {
    const onConnect = () => {
      console.log("Connected:", socket.id);
      setStatus(`Connected: ${socket.id}`);
    };

    const onError = (error: Error) => {
      console.error("Socket connection error:", error.message);
      setStatus(`Error: ${error.message}`);
    };

    const onDisconnect = (reason: string) => {
      console.log("Disconnected:", reason);
      setStatus("Disconnected");
    };

    socket.on("connect", onConnect);
    socket.on("connect_error", onError);
    socket.on("disconnect", onDisconnect);

    socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("connect_error", onError);
      socket.off("disconnect", onDisconnect);
      socket.disconnect();
    };
  }, []);

  return <div>Socket Status: {status}</div>;
}