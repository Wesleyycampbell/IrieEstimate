"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function WorkspaceLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/hq-workspace";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/workspace/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      router.push(from);
      router.refresh();
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf9f6] px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="w-8 h-8 bg-ink-800 rounded-md flex items-center justify-center text-cane-400 text-xs font-bold">
            IE
          </span>
          <span className="font-bold text-ink-800 text-lg">Workspace</span>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-ink-200/70 p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border-2 border-ink-200/70 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-ink-300 focus:border-ink-300 outline-none"
              placeholder="you@irieestimate.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border-2 border-ink-200/70 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-ink-300 focus:border-ink-300 outline-none"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-bold bg-ink-800 text-cane-400 hover:bg-ink-900 transition disabled:opacity-50 text-sm"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
