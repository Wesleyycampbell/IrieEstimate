"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AdSlot from "@/components/ad-slot";

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  coverImage: string | null;
  publishedAt: string | null;
  authorEmail: string | null;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("/")) return trimmed;
  return "#";
}

function renderMarkdown(md: string): string {
  const escaped = escapeHtml(md);
  return escaped
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold mt-8 mb-3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-10 mb-4">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\[(.+?)\]\((.+?)\)/g, (_m, text, url) =>
      `<a href="${sanitizeUrl(url)}" class="text-cane-600 font-semibold hover:underline" rel="noopener noreferrer">${text}</a>`)
    .replace(/\n\n/g, '</p><p class="text-ink-500 leading-relaxed mb-4">')
    .replace(/^/, '<p class="text-ink-500 leading-relaxed mb-4">')
    .replace(/$/, "</p>");
}

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/blog/${slug}`)
      .then((r) => {
        if (r.status === 404) {
          setNotFound(true);
          setLoading(false);
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data?.post) setPost(data.post);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-JM", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-ink-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-[72px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-ink-800 text-base">
            <span className="w-8 h-8 bg-ink-800 rounded-md flex items-center justify-center text-cane-400 text-[11px] font-bold">
              IE
            </span>
            IrieEstimate
          </Link>
          <nav className="flex items-center gap-4 sm:gap-6 text-base">
            <Link href="/blog" className="py-2 text-ink-400 hover:text-ink-800 transition font-medium">
              Blog
            </Link>
            <Link href="/about" className="hidden sm:inline py-2 text-ink-400 hover:text-ink-800 transition">
              About
            </Link>
            <Link
              href="/estimate"
              className="px-5 py-2.5 min-h-[44px] flex items-center bg-cane-400 text-ink-800 rounded-lg font-semibold text-base hover:bg-cane-500 transition"
            >
              Get Estimate
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12 flex-1">
        {loading ? (
          <div className="text-ink-400">Loading...</div>
        ) : notFound ? (
          <div>
            <h1 className="text-2xl font-bold mb-2">Post not found</h1>
            <p className="text-ink-400 mb-6">This blog post doesn&apos;t exist or has been removed.</p>
            <Link href="/blog" className="text-cane-600 font-semibold hover:underline">
              ← Back to blog
            </Link>
          </div>
        ) : post ? (
          <article>
            <Link
              href="/blog"
              className="text-sm text-ink-400 hover:text-ink-600 transition mb-6 inline-block"
            >
              ← Back to blog
            </Link>
            {post.publishedAt && (
              <time className="block text-xs text-ink-300 font-medium uppercase tracking-wider mb-2">
                {fmtDate(post.publishedAt)}
              </time>
            )}
            <h1 className="text-3xl sm:text-4xl font-bold mb-8 leading-tight">
              {post.title}
            </h1>
            <div
              className="prose-custom"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
            />

            <AdSlot page="blog" />

            <div className="mt-12 pt-8 border-t border-ink-100">
              <div className="bg-ink-800 rounded-lg p-6 text-white">
                <h3 className="font-bold text-lg mb-2">Ready to estimate your build?</h3>
                <p className="text-ink-300 text-sm mb-4">
                  Get a detailed labour cost breakdown for your Jamaican construction project.
                </p>
                <Link
                  href="/estimate"
                  className="inline-block px-6 py-2.5 bg-cane-400 text-ink-800 rounded-lg font-bold text-sm hover:bg-cane-500 transition"
                >
                  Start your estimate →
                </Link>
              </div>
            </div>
          </article>
        ) : null}
      </main>

      <footer className="border-t border-ink-200/50 text-ink-300 text-sm py-8 mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-semibold text-ink-500">
            <span className="w-6 h-6 bg-ink-800 rounded-md flex items-center justify-center text-cane-400 text-[9px] font-bold">
              IE
            </span>
            IrieEstimate
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/estimate" className="text-ink-300 hover:text-ink-500 transition">Estimate</Link>
            <Link href="/blog" className="text-ink-300 hover:text-ink-500 transition">Blog</Link>
            <Link href="/about" className="text-ink-300 hover:text-ink-500 transition">About</Link>
            <Link href="/terms" className="text-ink-300 hover:text-ink-500 transition">Terms</Link>
          </nav>
          <span className="text-ink-300">Jamaica &middot; 2026</span>
        </div>
      </footer>
    </>
  );
}
