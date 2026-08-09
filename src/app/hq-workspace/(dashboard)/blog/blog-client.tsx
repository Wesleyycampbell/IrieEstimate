"use client";

import { useEffect, useState } from "react";

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  authorEmail: string | null;
  createdAt: string;
}

type View = "list" | "create" | "edit";

export default function BlogClient() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("list");
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [isPublished, setIsPublished] = useState(false);

  async function loadPosts() {
    setLoading(true);
    try {
      const res = await fetch("/api/workspace/blog");
      const data = await res.json();
      setPosts(data.posts || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPosts();
  }, []);

  function resetForm() {
    setTitle("");
    setSlug("");
    setExcerpt("");
    setContent("");
    setIsPublished(false);
    setError("");
    setEditingPost(null);
  }

  function generateSlug(t: string) {
    return t
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function openCreate() {
    resetForm();
    setView("create");
  }

  function openEdit(post: Post) {
    setEditingPost(post);
    setTitle(post.title);
    setSlug(post.slug);
    setExcerpt(post.excerpt || "");
    setContent(post.content);
    setIsPublished(post.isPublished);
    setError("");
    setView("edit");
  }

  async function handleSave() {
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.");
      return;
    }

    const finalSlug = slug.trim() || generateSlug(title);
    setSaving(true);
    setError("");

    try {
      if (view === "create") {
        const res = await fetch("/api/workspace/blog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            slug: finalSlug,
            excerpt: excerpt.trim() || undefined,
            content: content.trim(),
            isPublished,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to create post");
          setSaving(false);
          return;
        }
      } else if (view === "edit" && editingPost) {
        const res = await fetch("/api/workspace/blog", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingPost.id,
            title: title.trim(),
            slug: finalSlug,
            excerpt: excerpt.trim() || undefined,
            content: content.trim(),
            isPublished,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to update post");
          setSaving(false);
          return;
        }
      }

      resetForm();
      setView("list");
      await loadPosts();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this blog post? This cannot be undone.")) return;

    try {
      const res = await fetch("/api/workspace/blog", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to delete");
        return;
      }
      await loadPosts();
    } catch {
      alert("Network error");
    }
  }

  async function togglePublish(post: Post) {
    try {
      await fetch("/api/workspace/blog", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: post.id, isPublished: !post.isPublished }),
      });
      await loadPosts();
    } catch {
      alert("Failed to update");
    }
  }

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-JM", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  // EDITOR VIEW
  if (view === "create" || view === "edit") {
    return (
      <div className="space-y-5 max-w-3xl">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">
            {view === "create" ? "New Post" : "Edit Post"}
          </h2>
          <button
            onClick={() => { resetForm(); setView("list"); }}
            className="text-sm text-ink-400 hover:text-ink-600"
          >
            Cancel
          </button>
        </div>

        <div className="bg-white rounded-lg border border-ink-200/70 p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (view === "create" && !slug) {
                  setSlug(generateSlug(e.target.value));
                }
              }}
              className="w-full border-2 border-ink-200/70 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-ink-300 focus:border-ink-300 outline-none"
              placeholder="Post title"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1">
              Slug
              <span className="text-ink-300 font-normal ml-1">(URL path)</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-ink-300">/blog/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="flex-1 border-2 border-ink-200/70 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-ink-300 focus:border-ink-300 outline-none"
                placeholder="my-post-title"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1">
              Excerpt
              <span className="text-ink-300 font-normal ml-1">(shown on blog list)</span>
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={2}
              className="w-full border-2 border-ink-200/70 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-ink-300 focus:border-ink-300 outline-none resize-none"
              placeholder="Brief summary of the post..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1">
              Content
              <span className="text-ink-300 font-normal ml-1">(supports Markdown: ## headings, **bold**, [links](url))</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={16}
              className="w-full border-2 border-ink-200/70 rounded-lg px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-ink-300 focus:border-ink-300 outline-none resize-y"
              placeholder="Write your blog post content here..."
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-5 h-5 accent-ink-800 rounded"
            />
            <span className="text-sm font-medium text-ink-700">
              Publish immediately
            </span>
          </label>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-ink-800 text-cane-400 rounded-lg font-bold text-sm hover:bg-ink-900 transition disabled:opacity-50"
          >
            {saving ? "Saving..." : view === "create" ? "Create Post" : "Save Changes"}
          </button>
          <button
            onClick={() => { resetForm(); setView("list"); }}
            className="px-5 py-2.5 text-sm font-semibold text-ink-400 hover:underline"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-400">{posts.length} post{posts.length !== 1 ? "s" : ""}</p>
        <button
          onClick={openCreate}
          className="px-5 py-2 bg-ink-800 text-cane-400 rounded-lg text-sm font-bold hover:bg-ink-900 transition"
        >
          + New Post
        </button>
      </div>

      {loading ? (
        <div className="text-ink-400 text-sm">Loading...</div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-lg border border-ink-200/70 p-8 text-center">
          <p className="text-ink-400 mb-4">No blog posts yet.</p>
          <button
            onClick={openCreate}
            className="px-5 py-2 bg-ink-800 text-cane-400 rounded-lg text-sm font-bold hover:bg-ink-900"
          >
            Write your first post
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-ink-200/70 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-200/70 bg-ink-50">
                <th className="text-left px-4 py-3 font-semibold text-ink-500 w-10">#</th>
                <th className="text-left px-4 py-3 font-semibold text-ink-500">Title</th>
                <th className="text-left px-4 py-3 font-semibold text-ink-500">Slug</th>
                <th className="text-left px-4 py-3 font-semibold text-ink-500">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-ink-500">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-ink-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post, idx) => (
                <tr key={post.id} className="border-b border-ink-100 last:border-0">
                  <td className="px-4 py-3 text-ink-300 font-medium">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium">{post.title}</td>
                  <td className="px-4 py-3 text-ink-400 font-mono text-xs">/blog/{post.slug}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => togglePublish(post)}
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        post.isPublished
                          ? "bg-green-100 text-green-700"
                          : "bg-ink-100 text-ink-400"
                      }`}
                    >
                      {post.isPublished ? "Published" : "Draft"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-ink-400 text-xs whitespace-nowrap">
                    {fmtDate(post.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openEdit(post)}
                        className="text-xs font-semibold text-cane-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="text-xs font-semibold text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                      {post.isPublished && (
                        <a
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-ink-400 hover:underline"
                        >
                          View
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
