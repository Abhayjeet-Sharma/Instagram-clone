
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type MediaType = "image" | "video";

export default function UploadPage() {
  const [mediaType, setMediaType] = useState<MediaType>("image");
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Clean up preview URLs to avoid memory leaks.
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) return;

    const allowedTypes =
      mediaType === "image"
        ? ["image/jpeg", "image/png", "image/webp", "image/gif"]
        : ["video/mp4", "video/webm"];

    if (!allowedTypes.includes(selectedFile.type)) {
      setMessage(
        mediaType === "image"
          ? "Only JPEG, PNG, WebP and GIF images are allowed"
          : "Only MP4 and WebM videos are allowed"
      );
      e.target.value = "";
      return;
    }

    const maxSize =
      mediaType === "image"
        ? 5 * 1024 * 1024
        : 50 * 1024 * 1024;

    if (selectedFile.size === 0 || selectedFile.size > maxSize) {
      setMessage(
        mediaType === "image"
          ? "Image size must not exceed 5 MB"
          : "Video size must not exceed 50 MB"
      );
      e.target.value = "";
      return;
    }

    setMessage("");
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  }

  function handleMediaTypeChange(type: MediaType) {
    setMediaType(type);
    setFile(null);
    setPreview(null);
    setMessage("");
  }

  async function handleImageUpload() {
    if (!file) throw new Error("Please select an image");

    const formData = new FormData();

    formData.append("caption", caption);
    formData.append("image", file);

    const response = await fetch("/api/posts", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Image upload failed");
    }

    return data;
  }

  async function handleVideoUpload() {
    if (!file) throw new Error("Please select a video");

    // 1. Request Cloudinary signature.
    const signatureResponse = await fetch(
      "/api/posts/signature",
      { method: "POST" }
    );

    const signatureData = await signatureResponse.json();

    if (!signatureResponse.ok) {
      throw new Error(
        signatureData.error || "Could not generate signature"
      );
    }

    // 2. Prepare Cloudinary upload.
    const formData = new FormData();

    formData.append("file", file);
    formData.append("api_key", signatureData.apiKey);
    formData.append("timestamp", String(signatureData.timestamp));
    formData.append("signature", signatureData.signature);
    formData.append("folder", signatureData.folder);

    // 3. Upload video directly to Cloudinary.
    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/video/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const uploadedVideo = await uploadResponse.json();

    if (!uploadResponse.ok) {
      throw new Error(
        uploadedVideo.error?.message || "Cloudinary upload failed"
      );
    }

    // 4. Save video metadata in PostgreSQL.
    const saveResponse = await fetch("/api/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        public_id: uploadedVideo.public_id,
        caption,
      }),
    });

    const saveData = await saveResponse.json();

    if (!saveResponse.ok) {
      throw new Error(
        saveData.error || "Failed to save video post"
      );
    }

    return saveData;
  }

  async function handleUpload() {
    if (!file) {
      setMessage(
        mediaType === "image"
          ? "Please select an image"
          : "Please select a video"
      );
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      if (mediaType === "image") {
        await handleImageUpload();
      } else {
        await handleVideoUpload();
      }

      setMessage(
        mediaType === "image"
          ? "Image post uploaded successfully!"
          : "Video post uploaded successfully!"
      );

      setCaption("");
      setFile(null);
      setPreview(null);

    } catch (error) {
      console.error("Upload error:", error);

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
      <h2 className="mb-5">
        <Link href="/">Back to feed</Link>
      </h2>

      <h1 className="text-2xl font-bold mb-6">
        Create Post
      </h1>

      {/* Media type selector */}
      <div className="flex gap-3 mb-6">
        <button
          type="button"
          onClick={() => handleMediaTypeChange("image")}
          disabled={loading}
          className={`px-5 py-2 rounded-lg ${
            mediaType === "image"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-black"
          }`}
        >
          Image
        </button>

        <button
          type="button"
          onClick={() => handleMediaTypeChange("video")}
          disabled={loading}
          className={`px-5 py-2 rounded-lg ${
            mediaType === "video"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-black"
          }`}
        >
          Video / Reel
        </button>
      </div>

      {/* Caption */}
      <textarea
        placeholder="Write a caption..."
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        disabled={loading}
        className="w-full border rounded-lg p-3 mb-4"
      />

      {/* File selector */}
      <input
        type="file"
        accept={
          mediaType === "image"
            ? "image/jpeg,image/png,image/webp,image/gif"
            : "video/mp4,video/webm"
        }
        onChange={handleFileChange}
        disabled={loading}
        className="mb-4"
      />

      {/* Preview */}
      {preview && (
        <div className="mb-5">
          {mediaType === "image" ? (
            <img
              src={preview}
              alt="Image preview"
              className="w-full max-h-96 object-contain rounded-lg"
            />
          ) : (
            <video
              src={preview}
              controls
              playsInline
              className="w-full max-h-96 rounded-lg"
            />
          )}
        </div>
      )}

      {/* Upload button */}
      <button
        onClick={handleUpload}
        disabled={loading || !file}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
      >
        {loading
          ? "Uploading..."
          : mediaType === "image"
            ? "Share Post"
            : "Upload Reel"}
      </button>

      {message && (
        <p className="mt-4">{message}</p>
      )}
    </main>
  );
}
