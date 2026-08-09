"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdSlot from "@/components/ad-slot";

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  publishedAt: string | null;
  authorEmail: string | null;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/blog")
      .then((r) => r.json())
      .then((data) => {
        setPosts(data.posts || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-JM", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-ink-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-ink-800">
            <span className="w-7 h-7 bg-ink-800 rounded-md flex items-center justify-center text-cane-400 text-[10px] font-bold">
              IE
            </span>
            IrieEstimate
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/blog" className="text-ink-800 font-semibold">
              Blog
            </Link>
            <Link
              href="/estimate"
              className="px-4 py-2 bg-cane-400 text-ink-800 rounded-lg font-semibold text-sm hover:bg-cane-500 transition"
            >
              Get Estimate
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 flex-1">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">Blog</h1>
        <p className="text-ink-400 mb-10">
          Construction tips, cost guides, and building advice for Jamaica.
        </p>

        <AdSlot page="blog" />

        {loading ? (
          <div className="text-ink-400">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="text-ink-400">No posts yet. Check back soon.</div>
        ) : (
          <div className="space-y-8">
            {posts.map((post) => (
              <article
                key={post.id}
                className="group border-b border-ink-100 pb-8 last:border-0"
              >
                <Link href={`/blog/${post.slug}`} className="block">
                  {post.publishedAt && (
                    <time className="text-xs text-ink-300 font-medium uppercase tracking-wider">
                      {fmtDate(post.publishedAt)}
                    </time>
                  )}
                  <h2 className="text-xl font-bold mt-1 mb-2 group-hover:text-cane-600 transition">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-ink-400 text-sm leading-relaxed">
                      {post.excerpt}
                    </p>
                  )}
                  <span className="inline-block mt-3 text-sm font-semibold text-cane-600">
                    Read more →
                  </span>
                </Link>
              </article>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-ink-200/50 text-ink-300 text-sm py-8 mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-semibold text-ink-500">
            <span className="w-6 h-6 bg-ink-800 rounded-md flex items-center justify-center text-cane-400 text-[9px] font-bold">
              IE
            </span>
            IrieEstimate
          </div>
          <div className="text-ink-300">Jamaica &middot; 2026</div>
        </div>
      </footer>
    </>
  );
}
