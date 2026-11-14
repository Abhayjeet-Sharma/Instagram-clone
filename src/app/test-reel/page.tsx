
"use client";

import { useState } from "react";

export default function TestReelUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleUpload() {
    if (!file) {
      alert("Select a video first");
      return;
    }

    if (!["video/mp4", "video/webm"].includes(file.type)) {
      alert("Only MP4 and WebM videos are allowed");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      alert("Maximum video size is 50 MB");
      return;
    }

    try {
      setLoading(true);

      // 1. Get upload signature from our backend
      const signatureResponse = await fetch(
        "/api/reels/signature",
        { method: "POST" }
      );

      if (!signatureResponse.ok) {
        throw new Error("Could not generate signature");
      }

      const signatureData = await signatureResponse.json();

      // 2. Prepare Cloudinary upload
      const formData = new FormData();

      formData.append("file", file);
      formData.append("api_key", signatureData.apiKey);
      formData.append("timestamp", String(signatureData.timestamp));
      formData.append("signature", signatureData.signature);
      formData.append("folder", signatureData.folder);

      // 3. Upload directly to Cloudinary
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

      // 4. Get the video URL
      setVideoUrl(uploadedVideo.secure_url);
      // 5. Save Reel metadata in PostgreSQL
const saveResponse = await fetch("/api/reels", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    public_id: uploadedVideo.public_id,
    caption: "My first Reel!",
  }),
});

const saveData = await saveResponse.json();

if (!saveResponse.ok) {
  console.error("Database save response:", saveData);

  throw new Error(
    saveData.details ||
    saveData.error ||
    "Database save failed"
  );
}

console.log("Saved Reel:", saveData.reel);

alert("Video uploaded and saved successfully!");
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error ? error.message : "Upload failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white p-10">

      <h1 className="text-2xl font-bold mb-6">
        Test Reel Upload
      </h1>

      <input
        type="file"
        accept="video/mp4,video/webm"
        onChange={(e) => {
          setFile(e.target.files?.[0] ?? null);
          setVideoUrl("");
        }}
        className="mb-5"
      />

      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="block rounded-lg bg-blue-600 px-5 py-3 disabled:opacity-50"
      >
        {loading ? "Uploading..." : "Upload Reel"}
      </button>

      {videoUrl && (
        <div className="mt-8 max-w-sm">
          <h2 className="mb-3">Uploaded Reel</h2>

          <video
            src={videoUrl}
            controls
            playsInline
            preload="metadata"
            className="w-full rounded-xl"
          />
        </div>
      )}

    </main>
  );
}
