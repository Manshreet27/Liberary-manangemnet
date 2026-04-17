"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠", roles: ["super_admin", "admin", "receptionist"] },
  { href: "/members", label: "Members", icon: "👥", roles: ["super_admin", "admin", "receptionist"] },
  { href: "/attendance", label: "Attendance", icon: "📋", roles: ["super_admin", "admin", "receptionist"] },
  { href: "/packages", label: "Packages", icon: "📦", roles: ["super_admin", "admin"] },
  { href: "/staff", label: "Staff", icon: "🧑‍💼", roles: ["super_admin", "admin"] },
  { href: "/libraries", label: "Libraries", icon: "🏛️", roles: ["super_admin"] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const [open, setOpen] = useState(false);

  const filtered = navItems.filter((item) => role && item.roles.includes(role));

  const SidebarContent = () => (
    <>
      <div className="p-4 border-b border-blue-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">📚 LibraryMS</h1>
            <p className="text-xs text-blue-300 mt-0.5 capitalize">{role?.replace("_", " ")}</p>
            {session?.user?.libraryName && (
              <p className="text-xs text-blue-200 truncate max-w-[160px]">{session.user.libraryName}</p>
            )}
          </div>
          <button className="lg:hidden text-blue-300 hover:text-white" onClick={() => setOpen(false)}>✕</button>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {filtered.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              pathname.startsWith(item.href)
                ? "bg-blue-600 text-white"
                : "text-blue-200 hover:bg-blue-700"
            }`}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-blue-700">
        <p className="text-xs text-blue-300 mb-2 truncate px-1">{session?.user?.email}</p>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full text-left text-xs text-blue-300 hover:text-white px-3 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          🚪 Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-blue-800 text-white flex items-center justify-between px-4 py-3 shadow-md">
        <span className="font-bold text-base">📚 LibraryMS</span>
        <button onClick={() => setOpen(true)} className="text-white text-xl leading-none">☰</button>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-full w-64 z-50 bg-blue-800 text-white flex flex-col transform transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-56 min-h-screen bg-blue-800 text-white flex-col flex-shrink-0">
        <SidebarContent />
      </aside>
    </>
  );
}
