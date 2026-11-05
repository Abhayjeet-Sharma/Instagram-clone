
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

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
          // Supports either { authenticated, user } or
          // { authenticated, id, username, email }.
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

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      setUser(null);
      router.push("/login");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Something went wrong"
      );
    }
  }

  // Hide the navbar on authentication pages.
  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  return (
    <nav className="border-b px-6 py-4 flex items-center justify-between">
      <Link href="/" className="text-xl font-bold">
        Instagram Clone
      </Link>

      <div className="flex items-center gap-5">
        <Link href="/" className="hover:text-blue-600">
          Feed
        </Link>

        {loading ? (
          <span className="text-sm text-gray-500">Loading...</span>
        ) : user ? (
          <>
            <Link href="/upload" className="hover:text-blue-600">
              Upload
            </Link>

            <span className="font-medium">
              @{user.username}
            </span>

            <button
              onClick={handleLogout}
              className="text-red-600 hover:text-red-800"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="hover:text-blue-600">
              Login
            </Link>

            <Link
              href="/register"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Register
            </Link>
          </>
        )}
      </div>

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </nav>
  );
}
