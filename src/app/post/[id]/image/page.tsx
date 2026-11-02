import { notFound } from "next/navigation";
import LikeButton from "./LikeButton";

export const instant = false;

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PostImagePage({ params }: Props) {
  const { id } = await params;

  if (!/^[1-9]\d*$/.test(id)) {
    notFound();
  }

  return (
    <main className="min-h-screen flex flex-col items-center p-6">
  <a href="/" className="mb-6 text-blue-600 hover:underline">
    ← Back to feed
  </a>

  <img
    src={`/api/posts/${id}/image`}
    alt={`Post ${id}`}
    className="max-w-full max-h-[80vh] object-contain rounded-lg"
  />

  <LikeButton postId={id} />

  <p className="mt-4 text-gray-500">Post #{id}</p>
</main>
  );
}