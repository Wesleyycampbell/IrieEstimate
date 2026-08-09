"use client";

import { useEffect, useState, useRef } from "react";

export default function SettingsPage() {
  const [pdfEnabled, setPdfEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const didFetch = useRef(false);

  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;
    fetch("/api/workspace/settings")
      .then((r) => r.json())
      .then((data) => {
        const settings = data.settings || {};
        setPdfEnabled(settings.pdf_download_enabled === "true");
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  async function togglePdf() {
    const newValue = !pdfEnabled;
    setSaving(true);
    try {
      const res = await fetch("/api/workspace/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "pdf_download_enabled", value: String(newValue) }),
      });
      if (res.ok) setPdfEnabled(newValue);
    } catch {
      // silent
    }
    setSaving(false);
  }

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold mb-6">Settings</h1>

      <div className="bg-white rounded-lg border border-ink-200/70 divide-y divide-ink-100">
        <div className="p-5 sm:p-6 flex items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-sm text-ink-800">PDF Download</h3>
            <p className="text-xs text-ink-400 mt-0.5">
              Allow users to download their estimate results as a PDF document.
            </p>
          </div>
          <button
            onClick={togglePdf}
            disabled={saving || !loaded}
            className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
              pdfEnabled ? "bg-cane-500" : "bg-ink-200"
            } ${saving || !loaded ? "opacity-50" : ""}`}
            aria-label={pdfEnabled ? "Disable PDF download" : "Enable PDF download"}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                pdfEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
