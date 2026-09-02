import Link from "next/link";
import { getSession } from "@/lib/workspace-auth";
import { redirect } from "next/navigation";
import MobileSidebar from "@/components/mobile-sidebar";

// Authenticated per-request admin area — never prerender at build time.
export const dynamic = "force-dynamic";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/hq-workspace/login");

  const navLinks = [
    { href: "/hq-workspace", label: "Overview" },
    { href: "/hq-workspace/pricing", label: "Pricing Engine" },
    { href: "/hq-workspace/leads", label: "Leads" },
    { href: "/hq-workspace/consultations", label: "Consultations" },
    { href: "/hq-workspace/blog", label: "Blog" },
    { href: "/hq-workspace/ads", label: "Ads Center" },
    { href: "/hq-workspace/settings", label: "Settings" },
  ];

  return (
    <div className="min-h-screen flex bg-[#faf9f6]">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 bg-ink-800 text-white flex-col shrink-0">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-2 font-bold">
            <span className="w-7 h-7 bg-cane-400 rounded-md flex items-center justify-center text-ink-800 text-[10px] font-bold">
              IE
            </span>
            Workspace
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-ink-200 hover:bg-white/10 hover:text-white transition"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10 text-xs text-ink-300">
          <div className="truncate">{session.email}</div>
          <div className="capitalize text-ink-400 mt-0.5">{session.role}</div>
        </div>
      </aside>

      {/* Mobile header + sidebar */}
      <MobileSidebar navLinks={navLinks} email={session.email} role={session.role} />

      <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-x-auto pt-16 md:pt-6">
        {children}
      </main>
    </div>
  );
}
