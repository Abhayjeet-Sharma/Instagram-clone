
"use client";

import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";
import {
  TbMessagesFilled,
  TbSearch,
  TbSend,
  TbPlus,
  TbArrowLeft,
} from "react-icons/tb";

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

type SearchUser = {
  id: string;
  username: string;
  display_name: string | null;
};

export default function MessagesPage() {
  const [suggestions, setSuggestions] = useState<SearchUser[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [username, setUsername] = useState("");
  const [myId, setMyId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (username.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/users/search?q=${encodeURIComponent(username)}`
        );
        const data = await response.json();

        if (response.ok) {
          setSuggestions(data.users);
        }
      } catch (error) {
        console.error("User search error:", error);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [username]);

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

    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          setMyId(String(data.user.id));
        }
      } catch (error) {
        console.error(error);
      }
    }

    loadConversations();
    loadUser();

    const handleReceive = (message: Message) => {
      if (
        String(message.conversation_id) ===
        String(selected?.conversation_id)
      ) {
        setMessages((prev) => {
          if (prev.some((m) => String(m.id) === String(message.id))) {
            return prev;
          }
          return [...prev, message];
        });
      }

      setConversations((prev) =>
        prev.map((conversation) =>
          String(conversation.conversation_id) ===
          String(message.conversation_id)
            ? {
                ...conversation,
                last_message: message.content,
                last_message_at: message.created_at,
                unread_count:
                  String(message.conversation_id) ===
                  String(selected?.conversation_id)
                    ? 0
                    : conversation.unread_count + 1,
              }
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
          `/api/conversations/${selected.conversation_id}/messages`
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
      socket.emit("join_conversation", selected.conversation_id);
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

  async function createConversation(targetUsername = username) {
    if (!targetUsername.trim()) return;

    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: targetUsername }),
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

      if (conversation) {
        setSelected(conversation);
        setMessages([]);
      }

      setUsername("");
      setSuggestions([]);
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
    <main className="min-h-[calc(100dvh-64px)] px-3 py-5 sm:px-6">
      <div className="mx-auto flex h-[calc(100dvh-110px)] max-w-[1400px] overflow-hidden rounded-3xl border border-white/10 bg-[#160d20]/65 shadow-[0_20px_80px_rgba(0,0,0,0.4)] backdrop-blur-2xl">

        {/* SIDEBAR */}
        <aside className={`w-full md:w-[350px] lg:w-[390px] shrink-0 flex-col border-r border-white/[0.08] bg-white/[0.025] ${
          selected ? "hidden md:flex" : "flex"
        }`}>

          {/* SIDEBAR HEADER */}
          <div className="border-b border-white/[0.08] p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Messages
                </h1>
                <p className="mt-1 text-xs text-white/40">
                  Your conversations on Luma
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/10 text-xl text-fuchsia-300 shadow-[0_0_20px_rgba(217,70,239,0.1)]">
                <TbMessagesFilled />
              </div>
            </div>

            {/* SEARCH */}
            <div className="relative">
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 transition-all focus-within:border-fuchsia-400/40 focus-within:bg-black/30">
                <TbSearch className="shrink-0 text-lg text-white/40" />

                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Search people..."
                  className="min-w-0 flex-1 bg-transparent py-3 text-sm text-white outline-none placeholder:text-white/30"
                />

                <button
                  type="button"
                  onClick={() => createConversation()}
                  disabled={!username.trim()}
                  aria-label="Start conversation"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 text-lg text-white transition-all hover:scale-105 disabled:opacity-40"
                >
                  <TbPlus />
                </button>
              </div>

              {/* SEARCH SUGGESTIONS */}
              {username.trim().length >= 2 && (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#21132b]/95 shadow-2xl backdrop-blur-2xl">
                  {suggestions.length > 0 ? (
                    suggestions.map((person) => (
                      <button
                        key={person.id}
                        onClick={() => createConversation(person.username)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.07]"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 text-sm font-bold text-white">
                          {(person.display_name || person.username)
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">
                            {person.display_name || person.username}
                          </p>
                          <p className="text-xs text-white/40">
                            @{person.username}
                          </p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="p-4 text-sm text-white/40">
                      No users found
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* CONVERSATION LIST */}
          <div className="flex-1 overflow-y-auto p-3">
            <p className="mb-3 px-3 pt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
              Recent conversations
            </p>

            {loading ? (
              <p className="p-4 text-sm text-white/40">
                Loading conversations...
              </p>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center px-5 py-12 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.05] text-2xl text-white/30">
                  <TbMessagesFilled />
                </div>
                <p className="text-sm font-medium text-white/70">
                  No conversations yet
                </p>
                <p className="mt-1 text-xs text-white/35">
                  Search for someone to start chatting.
                </p>
              </div>
            ) : (
              conversations.map((conversation) => {
                const active =
                  selected?.conversation_id === conversation.conversation_id;

                return (
                  <button
                    key={conversation.conversation_id}
                    onClick={() => setSelected(conversation)}
                    className={`mb-1 flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all duration-200 ${
                      active
                        ? "border-fuchsia-400/20 bg-gradient-to-r from-fuchsia-500/15 to-violet-500/10 shadow-[0_0_20px_rgba(217,70,239,0.06)]"
                        : "border-transparent hover:border-white/[0.06] hover:bg-white/[0.045]"
                    }`}
                  >
                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 text-base font-bold text-white">
                      {(conversation.display_name || conversation.username)
                        .charAt(0)
                        .toUpperCase()}

                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#1b1024] bg-emerald-400" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-white">
                          {conversation.display_name || conversation.username}
                        </p>

                        {conversation.unread_count > 0 && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-fuchsia-500 px-1.5 text-[10px] font-bold text-white">
                            {conversation.unread_count}
                          </span>
                        )}
                      </div>

                      <p className="mt-1 truncate text-xs text-white/40">
                        {conversation.last_message || "Start a conversation"}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* CHAT AREA */}
        <section className={`min-w-0 flex-1 flex-col ${
          selected ? "flex" : "hidden md:flex"
        }`}>

          {!selected ? (
            <div className="flex flex-1 flex-col items-center justify-center px-5 text-center">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-[30px] border border-fuchsia-400/20 bg-gradient-to-br from-fuchsia-500/15 to-violet-500/10 text-5xl text-fuchsia-300 shadow-[0_0_50px_rgba(217,70,239,0.1)]">
                <TbMessagesFilled />
              </div>

              <h2 className="text-2xl font-bold text-white">
                Your messages
              </h2>

              <p className="mt-2 max-w-sm text-sm text-white/40">
                Select a conversation or find someone new to start connecting.
              </p>
            </div>
          ) : (
            <>
              {/* CHAT HEADER */}
              <header className="flex shrink-0 items-center gap-3 border-b border-white/[0.08] bg-white/[0.025] px-5 py-4 backdrop-blur-xl">
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="mr-1 rounded-xl p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white md:hidden"
                  aria-label="Back to conversations"
                >
                  <TbArrowLeft className="text-xl" />
                </button>

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 text-sm font-bold text-white">
                  {(selected.display_name || selected.username)
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-sm font-bold text-white">
                    {selected.display_name || selected.username}
                  </h2>
                  <p className="text-xs text-white/40">
                    @{selected.username}
                  </p>
                </div>

                <div className="ml-auto flex items-center gap-2 rounded-full border border-emerald-400/10 bg-emerald-400/[0.06] px-3 py-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[10px] font-medium text-emerald-300">
                    Chat
                  </span>
                </div>
              </header>

              {/* MESSAGES */}
              <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
                {messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] text-2xl text-white/30">
                      <TbMessagesFilled />
                    </div>
                    <p className="text-sm font-medium text-white/60">
                      No messages yet
                    </p>
                    <p className="mt-1 text-xs text-white/30">
                      Send a message to start the conversation.
                    </p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const mine =
                      String(message.sender_id) === String(myId);

                    return (
                      <div
                        key={message.id}
                        className={`flex ${
                          mine ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 shadow-lg ${
                            mine
                              ? "rounded-br-md bg-gradient-to-br from-fuchsia-600 to-violet-600 text-white shadow-fuchsia-900/10"
                              : "rounded-bl-md border border-white/[0.08] bg-white/[0.055] text-white backdrop-blur-xl"
                          }`}
                        >
                          <p className="break-words text-sm leading-relaxed">
                            {message.content}
                          </p>

                          <p
                            className={`mt-1.5 text-right text-[10px] ${
                              mine ? "text-white/60" : "text-white/35"
                            }`}
                          >
                            {new Date(message.created_at).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* MESSAGE COMPOSER */}
              <div className="shrink-0 border-t border-white/[0.08] bg-white/[0.025] p-4">
                <form
                  onSubmit={sendMessage}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-2 pl-4 transition-all focus-within:border-fuchsia-400/30"
                >
                  <input
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write a message..."
                    className="min-w-0 flex-1 bg-transparent py-2 text-sm text-white outline-none placeholder:text-white/30"
                  />

                  <button
                    type="submit"
                    disabled={!content.trim()}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-600 to-violet-600 text-xl text-white shadow-lg shadow-fuchsia-900/20 transition-all hover:scale-105 hover:shadow-fuchsia-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Send message"
                  >
                    <TbSend />
                  </button>
                </form>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
