
import Link from "next/link";
import { notFound } from "next/navigation";
export const instant = false;
interface Props {
  params: Promise<{ username: string }>;
}

interface UserProfile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  created_at: string;
}

const mockPosts = [
  { id: 1, color: "bg-gradient-to-br from-orange-400 to-pink-500" },
  { id: 2, color: "bg-gradient-to-br from-blue-400 to-purple-600" },
  { id: 3, color: "bg-gradient-to-br from-green-400 to-teal-600" },
  { id: 4, color: "bg-gradient-to-br from-yellow-400 to-orange-500" },
  { id: 5, color: "bg-gradient-to-br from-pink-400 to-red-500" },
  { id: 6, color: "bg-gradient-to-br from-indigo-400 to-blue-600" },
];

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/users/${encodeURIComponent(username)}`,
    { cache: "no-store" }
  );

  if (response.status === 404) {
    notFound();
  }

  if (!response.ok) {
    throw new Error("Failed to fetch profile");
  }

  const data = await response.json();
  const profile: UserProfile = data.user;

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-4 py-10">

        <section className="flex flex-col gap-8 sm:flex-row sm:items-center sm:gap-16">

          {/* Profile Picture Placeholder */}
          <div className="flex justify-center sm:w-1/3">
            <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-4xl font-bold ring-2 ring-gray-600 ring-offset-4 ring-offset-black">
              {profile.username.charAt(0).toUpperCase()}
            </div>
          </div>

          {/* Profile Information */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-start">
              <h1 className="text-2xl font-normal">
                {profile.username}
              </h1>

              <Link
                href="/edit-profile"
                className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold hover:bg-gray-700"
              >
                Edit profile
              </Link>
            </div>

            {/* Stats */}
            <div className="my-6 flex justify-center gap-8 text-sm sm:justify-start sm:gap-10">
              <p><strong>0</strong> posts</p>
              <p><strong>0</strong> followers</p>
              <p><strong>0</strong> following</p>
            </div>

            {/* Bio */}
            <div className="text-center sm:text-left">
              <h2 className="font-semibold">
                {profile.display_name || profile.username}
              </h2>

              <p className="mt-1 whitespace-pre-line text-sm text-gray-300">
                {profile.bio || "No bio yet."}
              </p>
            </div>
          </div>
        </section>

        <div className="my-10 border-t border-gray-800" />

        {/* Posts Heading */}
        <div className="mb-5 flex justify-center">
          <span className="border-t border-white px-6 pt-3 text-sm font-semibold uppercase tracking-wider">
            Posts
          </span>
        </div>

        {/* Temporary Mock Posts */}
        <section className="grid grid-cols-3 gap-1 sm:gap-4">
          {mockPosts.map((post) => (
            <div
              key={post.id}
              className={`aspect-square ${post.color} flex items-center justify-center`}
            >
              <span className="text-3xl font-bold text-white/80">
                {post.id}
              </span>
            </div>
          ))}
        </section>

      </div>
    </main>
  );
}
