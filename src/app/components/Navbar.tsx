
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { TbMessagesFilled } from "react-icons/tb";
import Image from "next/image";

interface User {
  id: string;
  username: string;
  email: string;
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();

        if (response.ok && data.authenticated) {
          setUser(data.user ?? data);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Fetch user error:", error);
        setError("Unable to check login status");
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [pathname]);

  async function handleLogout() {
    setError("");

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) throw new Error("Logout failed");

      setUser(null);
      router.push("/login");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Something went wrong"
      );
    }
  }

  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  const navLink =
    "rounded-full px-4 py-2 text-sm font-medium text-white/70 transition-all duration-300 hover:bg-white/10 hover:text-white";

  return (
    <nav className="sticky top-0 z-50 w-full px-4 py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between rounded-2xl border border-white/10 bg-[#160d20]/65 px-5 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-2xl">

        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center">
          <Image
            src="/lumaNeon2.png"
            alt="Luma"
            width={100}
            height={35}
            priority
            className="object-contain"
          />
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/" className={navLink}>
            Feed
          </Link>

          {loading ? (
            <span className="px-3 text-xs text-white/40">Loading...</span>
          ) : user ? (
            <>
              <Link href="/upload" className={navLink}>
                Upload
              </Link>

              <Link
                href={`/profile/${encodeURIComponent(user.username)}`}
                className={`${navLink} hidden sm:block`}
              >
                @{user.username}
              </Link>

              <button
                onClick={handleLogout}
                className="rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition-all duration-300 hover:border-red-400/40 hover:bg-red-500/20 hover:text-red-200"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={navLink}>
                Login
              </Link>

              <Link
                href="/register"
                className="rounded-full bg-gradient-to-r from-fuchsia-600 to-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-[0_0_18px_rgba(217,70,239,0.25)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(217,70,239,0.45)]"
              >
                Register
              </Link>
            </>
          )}

          {/* Messages */}
          <Link
            href="/messages"
            aria-label="Messages"
            className="ml-1 flex h-10 w-10 items-center justify-center rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 text-xl text-fuchsia-300 transition-all duration-300 hover:border-fuchsia-400/50 hover:bg-fuchsia-500/20 hover:text-fuchsia-200 hover:shadow-[0_0_18px_rgba(217,70,239,0.35)]"
          >
            <TbMessagesFilled />
          </Link>
        </div>
      </div>

      {error && (
        <p className="mx-auto mt-2 max-w-7xl text-right text-xs text-red-400">
          {error}
        </p>
      )}
    </nav>
  );
}
