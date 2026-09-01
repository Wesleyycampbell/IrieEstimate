import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <>
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-ink-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-[72px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-ink-800 text-base">
            <span className="w-8 h-8 bg-ink-800 rounded-md flex items-center justify-center text-cane-400 text-[11px] font-bold">
              IE
            </span>
            IrieEstimate
          </Link>
          <Link
            href="/estimate"
            className="px-5 py-2.5 min-h-[44px] flex items-center bg-cane-400 text-ink-800 rounded-lg font-semibold text-base hover:bg-cane-500 transition"
          >
            Get Estimate
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-24 flex-1 text-center">
        <div className="text-7xl font-bold text-ink-200 mb-4">404</div>
        <h1 className="text-2xl font-bold mb-3">Page not found</h1>
        <p className="text-ink-400 text-sm mb-10 max-w-sm mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/"
            className="px-6 py-3 bg-ink-800 text-cane-400 rounded-lg font-bold text-sm hover:bg-ink-900 transition"
          >
            Back to home
          </Link>
          <Link
            href="/estimate"
            className="px-6 py-3 border-2 border-ink-200/70 text-ink-600 rounded-lg font-bold text-sm hover:bg-ink-50 transition"
          >
            Get an estimate
          </Link>
          <Link
            href="/blog"
            className="px-6 py-3 border-2 border-ink-200/70 text-ink-600 rounded-lg font-bold text-sm hover:bg-ink-50 transition"
          >
            Read the blog
          </Link>
        </div>
      </main>

      <footer className="border-t border-ink-200/50 text-ink-300 text-sm py-8 mt-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex items-center justify-center gap-2 font-semibold text-ink-500">
            <span className="w-6 h-6 bg-ink-800 rounded-md flex items-center justify-center text-cane-400 text-[9px] font-bold">
              IE
            </span>
            IrieEstimate
          </div>
        </div>
      </footer>
    </>
  );
}
