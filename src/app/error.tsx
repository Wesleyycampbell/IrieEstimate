"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-24">
      <div className="text-center">
        <div className="text-6xl font-bold text-ink-200 mb-4">500</div>
        <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
        <p className="text-ink-400 text-sm mb-8 max-w-sm mx-auto">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-ink-800 text-cane-400 rounded-lg font-bold text-sm hover:bg-ink-900 transition"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
