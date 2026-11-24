
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { useInView } from "react-intersection-observer";
import Image from "next/image";

import {
  TbX,
  TbPlayerPlayFilled,
  TbArrowUpRight,
  TbSparkles,
} from "react-icons/tb";

import Reels, { type Post } from "./components/reels";

type Cursor = {
  createdAt: string;
  id: string;
};

type FeedResponse = {
  success: boolean;
  posts: Post[];
  nextCursor: Cursor | null;
  hasMore: boolean;
};

type ExplorePostCardProps = {
  post: Post;
  index: number;
  onSelect: () => void;
};

// --------------------------------------------------
// EXPLORE POST CARD
// --------------------------------------------------

function ExplorePostCard({
  post,
  index,
  onSelect,
}: ExplorePostCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const aspectRatios = [
    "aspect-[4/5]",
    "aspect-[3/4]",
    "aspect-square",
    "aspect-[4/5]",
    "aspect-[3/5]",
    "aspect-[4/5]",
  ];

  const aspectRatio = aspectRatios[index % aspectRatios.length];

  const handleMouseEnter = () => {
    if (post.content_type !== "video") return;

    videoRef.current?.play().catch(() => {});
  };

  const handleMouseLeave = () => {
    if (!videoRef.current) return;

    videoRef.current.pause();
    videoRef.current.currentTime = 0;
  };

  return (
    <div
      onClick={onSelect}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`group relative mb-4 w-full cursor-pointer break-inside-avoid overflow-hidden rounded-2xl border border-white/10 bg-[#170e20]/70 shadow-lg shadow-black/20 ${aspectRatio}`}
    >
      {post.content_type === "video" ? (
        <video
          ref={videoRef}
          src={post.video_url || undefined}
          poster={post.thumbnail_url || undefined}
          muted
          loop
          playsInline
          preload="none"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <Image
          src={`/api/posts/${post.id}/image`}
          alt={post.caption || "Luma post"}
          fill
          unoptimized
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/5 to-black/10 opacity-75 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Video indicator */}
      {post.content_type === "video" && (
        <div className="absolute right-3 top-3 rounded-full border border-white/20 bg-black/40 p-2 backdrop-blur-md">
          <TbPlayerPlayFilled
            className="text-white"
            size={15}
          />
        </div>
      )}

      {/* User and caption */}
      <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/30 bg-gradient-to-tr from-fuchsia-500 to-violet-600 text-xs font-bold text-white">
            {post.profile_picture ? (
              <Image
                src={post.profile_picture}
                alt={post.username || "User"}
                fill
                unoptimized
                className="object-cover"
              />
            ) : (
              post.username?.[0]?.toUpperCase() || "L"
            )}
          </div>

          <span className="truncate text-sm font-semibold text-white">
            {post.username || "Luma creator"}
          </span>
        </div>

        {post.caption && (
          <p className="mt-2 line-clamp-2 text-xs text-white/80 sm:text-sm">
            {post.caption}
          </p>
        )}
      </div>

      {/* Hover action */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="rounded-full border border-white/20 bg-white/15 p-3 backdrop-blur-xl">
          <TbArrowUpRight
            className="text-white"
            size={23}
          />
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------
// EXPLORE SKELETON
// --------------------------------------------------

function ExploreSkeleton() {
  return (
    <div className="columns-2 gap-4 sm:columns-2 lg:columns-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className={`mb-4 break-inside-avoid animate-pulse rounded-2xl border border-white/10 bg-white/[0.04] ${
            index % 2 === 0
              ? "aspect-[4/5]"
              : "aspect-[3/4]"
          }`}
        />
      ))}
    </div>
  );
}

// --------------------------------------------------
// HOME
// --------------------------------------------------

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);

  const [currentUserId, setCurrentUserId] = useState<string | null>(
    null
  );

  const [currentUsername, setCurrentUsername] = useState<string | null>(
    null
  );

  // Viewer state
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const viewerRef = useRef<HTMLDivElement>(null);

  // Loading and error states
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const cursorRef = useRef<Cursor | null>(null);
  const hasMoreRef = useRef(true);
  const requestInProgress = useRef(false);

  // Keep a reactive copy for rendering the end-of-feed state.
  const [hasMore, setHasMore] = useState(true);

  // Shared infinite-scroll observer
  const { ref: sentinelRef, inView } = useInView({
    threshold: 0,
    rootMargin: "500px",
  });

  // --------------------------------------------------
  // FETCH CURRENT USER
  // --------------------------------------------------

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (!response.ok) return;

        const data = await response.json();

        setCurrentUserId(data.user?.id || null);
        setCurrentUsername(data.user?.username || null);
      } catch (err) {
        console.error("Failed to fetch current user:", err);
      }
    };

    fetchCurrentUser();
  }, []);

  // --------------------------------------------------
  // FETCH POSTS
  // --------------------------------------------------

  const fetchPosts = useCallback(async (reset = false) => {
    if (requestInProgress.current) return;

    if (!reset && !hasMoreRef.current) return;

    requestInProgress.current = true;
    setError(null);

    if (reset) {
      setInitialLoading(true);
      cursorRef.current = null;
      hasMoreRef.current = true;
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams({
        limit: "15",
      });

      if (cursorRef.current) {
        params.set(
          "cursorCreatedAt",
          cursorRef.current.createdAt
        );

        params.set(
          "cursorId",
          cursorRef.current.id
        );
      }

      const response = await fetch(
        `/api/posts?${params.toString()}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load posts");
      }

      const data: FeedResponse = await response.json();

      if (!data.success) {
        throw new Error("Something went wrong while loading posts");
      }

      setPosts((previousPosts) => {
        if (reset) {
          return data.posts;
        }

        const existingIds = new Set(
          previousPosts.map((post) => post.id)
        );

        const newPosts = data.posts.filter(
          (post) => !existingIds.has(post.id)
        );

        return [...previousPosts, ...newPosts];
      });

      cursorRef.current = data.nextCursor;

      hasMoreRef.current = data.hasMore;
      setHasMore(data.hasMore);
    } catch (err) {
      console.error("Feed error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load posts"
      );
    } finally {
      requestInProgress.current = false;
      setInitialLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // --------------------------------------------------
  // INITIAL FETCH
  // --------------------------------------------------

  useEffect(() => {
    fetchPosts(true);
  }, [fetchPosts]);

  // --------------------------------------------------
  // SHARED INFINITE SCROLL
  // --------------------------------------------------

  useEffect(() => {
    if (
      inView &&
      hasMoreRef.current &&
      !initialLoading &&
      !error
    ) {
      fetchPosts();
    }
  }, [inView, initialLoading, error, fetchPosts]);

  // --------------------------------------------------
  // OPEN VIEWER
  // --------------------------------------------------

  const openPostViewer = (post: Post, index: number) => {
    setSelectedIndex(index);
    setSelectedPost(post);
  };

  // --------------------------------------------------
  // SCROLL TO SELECTED POST
  // --------------------------------------------------

  useEffect(() => {
    if (!selectedPost) return;

    const frame = requestAnimationFrame(() => {
      const viewer = viewerRef.current;

      if (!viewer) return;

      const selectedElement = viewer.querySelector(
        `[data-post-index="${selectedIndex}"]`
      ) as HTMLElement | null;

      if (selectedElement) {
        viewer.scrollTo({
          top: selectedElement.offsetTop,
          behavior: "instant",
        });
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [selectedPost, selectedIndex]);

  // --------------------------------------------------
  // DELETE POST
  // --------------------------------------------------

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch("/api/posts", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to delete post"
        );
      }

      setPosts((previousPosts) =>
        previousPosts.filter((post) => post.id !== id)
      );

      setSelectedPost(null);
    } catch (err) {
      console.error("Delete error:", err);

      alert(
        err instanceof Error
          ? err.message
          : "Failed to delete post"
      );
    }
  };

  // --------------------------------------------------
  // CLOSE VIEWER
  // --------------------------------------------------

  const closeViewer = () => {
    setSelectedPost(null);
  };

  // Lock background scrolling and support Escape
  useEffect(() => {
    if (!selectedPost) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeViewer();
      }
    };

    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedPost]);

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <main className="min-h-screen px-3 pb-16 pt-6 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">

        {/* EXPLORE HEADING */}

        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <TbSparkles
                className="text-fuchsia-400"
                size={23}
              />

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Explore
              </h1>
            </div>

            <p className="mt-1 text-sm text-white/45">
              Discover moments, stories and creativity.
            </p>
          </div>

          {currentUsername && (
            <div className="hidden rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/60 backdrop-blur-xl sm:block">
              Welcome,{" "}
              <span className="font-semibold text-fuchsia-300">
                {currentUsername}
              </span>
            </div>
          )}
        </div>

        {/* INITIAL LOADING */}

        {initialLoading && <ExploreSkeleton />}

        {/* INITIAL ERROR */}

        {!initialLoading && error && posts.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-16 text-center backdrop-blur-xl">
            <p className="text-lg font-semibold">
              Couldn't load Explore
            </p>

            <p className="mt-2 text-sm text-white/50">
              {error}
            </p>

            <button
              onClick={() => fetchPosts(true)}
              className="mt-5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 px-6 py-2.5 text-sm font-semibold transition hover:opacity-90"
            >
              Try again
            </button>
          </div>
        )}

        {/* MASONRY GRID */}

        {!initialLoading && posts.length > 0 && (
          <div className="columns-2 gap-3 sm:columns-2 sm:gap-4 lg:columns-3 xl:columns-4">
            {posts.map((post, index) => (
              <ExplorePostCard
                key={post.id}
                post={post}
                index={index}
                onSelect={() => openPostViewer(post, index)}
              />
            ))}
          </div>
        )}

        {/* EMPTY STATE */}

        {!initialLoading &&
          !error &&
          posts.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-20 text-center backdrop-blur-xl">
              <TbSparkles
                size={38}
                className="text-fuchsia-400"
              />

              <h2 className="mt-4 text-xl font-semibold">
                Nothing to explore yet
              </h2>

              <p className="mt-2 text-sm text-white/45">
                Be the first to share something with the Luma community.
              </p>
            </div>
          )}

        {/* LOADING MORE */}

        {loadingMore && !selectedPost && (
          <div className="py-8 text-center text-sm text-white/50">
            Loading more posts...
          </div>
        )}

        {/* PAGINATION ERROR */}

        {!initialLoading && error && posts.length > 0 && (
          <div className="py-6 text-center">
            <p className="mb-3 text-sm text-red-300">
              {error}
            </p>

            <button
              onClick={() => fetchPosts()}
              className="rounded-xl border border-white/15 bg-white/[0.06] px-5 py-2 text-sm transition hover:bg-white/10"
            >
              Retry
            </button>
          </div>
        )}

        {/* EXPLORE INFINITE SCROLL SENTINEL */}

        {!selectedPost &&
          !initialLoading &&
          hasMore && (
            <div
              ref={sentinelRef}
              className="h-10 w-full"
            />
          )}

        {/* END OF EXPLORE FEED */}

        {!selectedPost &&
          !initialLoading &&
          posts.length > 0 &&
          !hasMore && (
            <p className="py-10 text-center text-xs text-white/35">
              You've reached the end of Explore ✨
            </p>
          )}
      </div>

      {/* --------------------------------------------------
          FULL SCREEN VERTICAL VIEWER
      -------------------------------------------------- */}

      {selectedPost && (
        <div className="fixed inset-0 z-[100] bg-black">

          {/* CLOSE BUTTON */}

          <button
            onClick={closeViewer}
            aria-label="Close viewer"
            className="absolute right-4 top-4 z-[120] flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-xl transition hover:bg-fuchsia-600"
          >
            <TbX size={23} />
          </button>

          {/* VERTICAL SCROLL CONTAINER */}

          <div
            ref={viewerRef}
            className="relative h-[100dvh] overflow-y-auto snap-y snap-mandatory"
            style={{
              scrollbarWidth: "none",
            }}
          >
            {posts.map((post, index) => (
              <section
                key={post.id}
                data-post-index={index}
                className="flex h-[100dvh] w-full snap-start snap-always items-center justify-center overflow-hidden px-2 py-3 sm:px-5"
              >
                <div className="h-full w-full max-w-5xl overflow-y-auto rounded-2xl border border-white/10 bg-[#120b19] shadow-2xl sm:rounded-3xl">
                  <Reels
                    post={post}
                    currentUserId={currentUserId}
                    onDelete={handleDelete}
                  />
                </div>
              </section>
            ))}

            {/* VIEWER INFINITE SCROLL SENTINEL */}

            {hasMore && (
              <div
                ref={sentinelRef}
                className="flex h-24 items-center justify-center text-sm text-white/50"
              >
                Loading more posts...
              </div>
            )}

            {/* VIEWER END */}

            {!hasMore && posts.length > 0 && (
              <div className="flex h-24 items-center justify-center text-sm text-white/40">
                You're all caught up ✨
              </div>
            )}

            {/* VIEWER PAGINATION ERROR */}

            {error && posts.length > 0 && (
              <div className="flex h-24 items-center justify-center gap-3 text-sm text-red-300">
                <span>{error}</span>

                <button
                  onClick={() => fetchPosts()}
                  className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-white"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
