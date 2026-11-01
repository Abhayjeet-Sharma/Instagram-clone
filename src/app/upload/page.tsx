"use client";

import { useState } from "react";

export default function UploadPage() {
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function handleImageChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleUpload() {
    if (!image) {
      setMessage("Please select an image");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const formData = new FormData();

      formData.append("caption", caption);
      formData.append("image", image);

      const response = await fetch("/api/posts", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setMessage("Post uploaded successfully!");

      setCaption("");
      setImage(null);
      setPreview(null);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">
        Create Post
      </h1>

      <textarea
        placeholder="Write a caption..."
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        className="w-full border rounded-lg p-3 mb-4"
      />

      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleImageChange}
        className="mb-4"
      />

      {preview && (
        <img
          src={preview}
          alt="Preview"
          className="w-full max-h-96 object-contain rounded-lg mb-4"
        />
      )}

      <button
        onClick={handleUpload}
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
      >
        {loading ? "Uploading..." : "Share Post"}
      </button>

      {message && (
        <p className="mt-4">{message}</p>
      )}
    </main>
  );
}