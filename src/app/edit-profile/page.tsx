
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Profile {
  username: string;
  display_name: string | null;
  bio: string | null;
}

export default function EditProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [picture, setPicture] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Fetch the currently logged-in user's profile
  useEffect(() => {
    async function loadProfile() {
      try {
        const authResponse = await fetch("/api/auth/me");
        const authData = await authResponse.json();

        if (!authResponse.ok) {
          router.replace("/login");
          return;
        }

        const user = authData.user ?? authData;

        const response = await fetch(
          `/api/users/${encodeURIComponent(user.username)}`
        );

        if (!response.ok) {
          throw new Error("Failed to load profile");
        }

        const data = await response.json();
        const userProfile: Profile = data.user;

        setProfile(userProfile);
        setDisplayName(userProfile.display_name ?? "");
        setBio(userProfile.bio ?? "");
      } catch (err) {
        console.error("Profile loading error:", err);
        setError("Unable to load profile.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  // Preview selected profile picture
  useEffect(() => {
    if (!picture) {
      setPreview("");
      return;
    }

    const imageUrl = URL.createObjectURL(picture);
    setPreview(imageUrl);

    return () => URL.revokeObjectURL(imageUrl);
  }, [picture]);

  // Validate selected profile picture
  function handlePictureChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPicture(null);
      setError("Only JPEG, PNG and WebP images are allowed.");
      event.target.value = "";
      return;
    }

    if (file.size === 0 || file.size > 5 * 1024 * 1024) {
      setPicture(null);
      setError("Profile picture must be between 1 byte and 5 MB.");
      event.target.value = "";
      return;
    }

    setError("");
    setPicture(file);
  }

  // Submit profile updates
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!profile) return;

    setError("");
    setSubmitting(true);

    try {
      const formData = new FormData();

      formData.append("displayName", displayName);
      formData.append("bio", bio);

      if (picture) {
        formData.append("profilePicture", picture);
      }

      const response = await fetch("/api/users/me/profile", {
        method: "PATCH",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      router.push(
        `/profile/${encodeURIComponent(profile.username)}`
      );
      router.refresh();
    } catch (err) {
      console.error("Profile update error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong"
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black p-8 text-center text-white">
        Loading profile...
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-black p-8 text-center text-white">
        {error || "Profile not found."}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white">
      <div className="mx-auto max-w-xl">
        <h1 className="mb-8 text-2xl font-semibold">
          Edit Profile
        </h1>

        <form onSubmit={handleSubmit} className="space-y-7">
          {/* Profile Picture */}
          <div className="flex items-center gap-5 rounded-xl bg-gray-900 p-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-2xl font-bold">
              {preview ? (
                <img
                  src={preview}
                  alt="Profile preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                profile.username.charAt(0).toUpperCase()
              )}
            </div>

            <div>
              <p className="font-semibold">
                {profile.username}
              </p>

              <label className="mt-2 inline-block cursor-pointer text-sm font-semibold text-blue-400 hover:text-blue-300">
                Change profile picture

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePictureChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Display Name
            </label>

            <input
              type="text"
              maxLength={50}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name"
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 outline-none focus:border-blue-500"
            />

            <p className="mt-1 text-right text-xs text-gray-500">
              {displayName.length}/50
            </p>
          </div>

          {/* Bio */}
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Bio
            </label>

            <textarea
              maxLength={160}
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell people about yourself..."
              className="w-full resize-none rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 outline-none focus:border-blue-500"
            />

            <p className="mt-1 text-right text-xs text-gray-500">
              {bio.length}/160
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-400">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>

            <button
              type="button"
              onClick={() => router.back()}
              disabled={submitting}
              className="rounded-lg bg-gray-800 px-6 py-3 font-semibold hover:bg-gray-700 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
