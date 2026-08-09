"use client";

import { useState } from "react";
import Link from "next/link";

interface Props {
  navLinks: { href: string; label: string }[];
  email: string;
  role: string;
}

export default function MobileSidebar({ navLinks, email, role }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-ink-800 text-white h-14 flex items-center px-4 gap-3">
        <button onClick={() => setOpen(!open)} className="w-8 h-8 flex items-center justify-center">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open ? (
              <path strokeLinecap="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
        <div className="flex items-center gap-2 font-bold text-sm">
          <span className="w-6 h-6 bg-cane-400 rounded-md flex items-center justify-center text-ink-800 text-[9px] font-bold">IE</span>
          Workspace
        </div>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-ink-800 text-white flex flex-col">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold">
                <span className="w-7 h-7 bg-cane-400 rounded-md flex items-center justify-center text-ink-800 text-[10px] font-bold">IE</span>
                Workspace
              </div>
              <button onClick={() => setOpen(false)} className="text-ink-300 hover:text-white">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm font-medium text-ink-200 hover:bg-white/10 hover:text-white transition"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t border-white/10 text-xs text-ink-300">
              <div className="truncate">{email}</div>
              <div className="capitalize text-ink-400 mt-0.5">{role}</div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
