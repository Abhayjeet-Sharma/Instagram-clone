
"use client";

import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";

type Conversation = {
  conversation_id: string;
  other_user_id: string;
  username: string;
  display_name: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
};

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  username: string;
};

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [username, setUsername] = useState("");
  const [myId, setMyId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadConversations() {
      try {
        const response = await fetch("/api/conversations");
        const data = await response.json();

        if (response.ok) {
          setConversations(data.conversations);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadConversations();

    async function loadUser() {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        setMyId(String(data.user.id));
      }
    }

    loadUser();

    const handleReceive = (message: Message) => {
      if (String(message.conversation_id) === String(selected?.conversation_id)) {
        setMessages((prev) => {
          if (prev.some((m) => String(m.id) === String(message.id))) {
            return prev;
          }
          return [...prev, message];
        });
      }

      setConversations((prev) =>
        prev.map((conversation) =>
          String(conversation.conversation_id) === String(message.conversation_id)
            ? { ...conversation, last_message: message.content }
            : conversation
        )
      );
    };

    socket.on("receive_message", handleReceive);
    socket.connect();

    return () => {
      socket.off("receive_message", handleReceive);
    };
  }, [selected?.conversation_id]);

  useEffect(() => {
    if (!selected) return;

    let active = true;

    async function loadMessages() {
      try {
        const response = await fetch(
          `/api/conversations/${selected!.conversation_id}/messages`
        );

        const data = await response.json();

        if (active && response.ok) {
          setMessages(data.messages);
        }
      } catch (error) {
        console.error(error);
      }
    }

    const joinRoom = () => {
      socket.emit("join_conversation", selected!.conversation_id);
    };

    if (socket.connected) {
      joinRoom();
    } else {
      socket.connect();
      socket.once("connect", joinRoom);
    }

    loadMessages();

    return () => {
      active = false;
      socket.off("connect", joinRoom);
    };
  }, [selected]);

  async function createConversation() {
    if (!username.trim()) return;

    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Could not create conversation");
        return;
      }

      const conversationId = String(data.conversation.id);

      const updated = await fetch("/api/conversations");
      const result = await updated.json();

      setConversations(result.conversations);

      const conversation = result.conversations.find(
        (c: Conversation) =>
          String(c.conversation_id) === conversationId
      );

      if (conversation) setSelected(conversation);

      setUsername("");
    } catch (error) {
      console.error(error);
    }
  }

  function sendMessage(e: React.FormEvent) {
    e.preventDefault();

    if (!content.trim() || !selected || !socket.connected) return;

    socket.emit("send_message", {
      conversationId: selected.conversation_id,
      content: content.trim(),
    });

    setContent("");
  }

  return (
    <div className="h-[calc(100dvh-64px)] bg-black text-white flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full md:w-96 border-r border-gray-800 flex flex-col">
        <div className="p-5 border-b border-gray-800">
          <h1 className="text-2xl font-bold mb-4">Messages</h1>

          <div className="flex gap-2">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="min-w-0 flex-1 bg-gray-900 rounded-lg px-3 py-2 outline-none"
            />

            <button
              onClick={createConversation}
              className="bg-blue-600 px-4 rounded-lg"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="p-5 text-gray-400">Loading...</p>
          ) : conversations.length === 0 ? (
            <p className="p-5 text-gray-400">No conversations yet.</p>
          ) : (
            conversations.map((conversation) => (
              <button
                key={conversation.conversation_id}
                onClick={() => setSelected(conversation)}
                className={`w-full text-left p-4 border-b border-gray-900 hover:bg-gray-900 ${
                  selected?.conversation_id === conversation.conversation_id
                    ? "bg-gray-900"
                    : ""
                }`}
              >
                <p className="font-semibold">
                  {conversation.display_name || conversation.username}
                </p>
                <p className="text-sm text-gray-400 truncate">
                  {conversation.last_message || "Start a conversation"}
                </p>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Chat area */}
      <section className="hidden md:flex flex-1 flex-col">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a conversation to start messaging
          </div>
        ) : (
          <>
            <header className="p-5 border-b border-gray-800">
              <h2 className="font-bold text-lg">
                {selected.display_name || selected.username}
              </h2>
              <p className="text-sm text-gray-400">
                @{selected.username}
              </p>
            </header>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {messages.map((message) => {
                const mine =
                  String(message.sender_id) === String(myId);

                return (
                  <div
                    key={message.id}
                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                        mine ? "bg-blue-600" : "bg-gray-800"
                      }`}
                    >
                      <p className="break-words">{message.content}</p>
                      <p className="text-xs text-gray-300 mt-1">
                        {new Date(message.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <form
              onSubmit={sendMessage}
              className="p-4 border-t border-gray-800 flex gap-3"
            >
              <input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Message..."
                className="flex-1 bg-gray-900 rounded-full px-5 py-3 outline-none"
              />

              <button
                type="submit"
                disabled={!content.trim()}
                className="bg-blue-600 px-6 rounded-full disabled:opacity-40"
              >
                Send
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
