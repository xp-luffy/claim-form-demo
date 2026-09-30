"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "Overview", icon: "◫" },
  { href: "/claims", label: "Claims", icon: "▤" },
  { href: "/claims/new", label: "New claim", icon: "+" },
  { href: "/payments", label: "Payments", icon: "↗" },
  { href: "/departments", label: "Departments", icon: "⌘" },
  { href: "/audit", label: "Activity", icon: "◷" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app-frame flex">
      <button
        className={`mobile-nav-backdrop ${menuOpen ? "show" : ""}`}
        aria-label="Close navigation"
        onClick={() => setMenuOpen(false)}
      />
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <Link className="brand" href="/" onClick={() => setMenuOpen(false)}>
          <span className="brand-mark">f.</span> fieldnote
        </Link>
        <div className="nav-label">Workspace</div>
        <nav aria-label="Main navigation" className="flex flex-col">
          {links.map((link) => {
            const active = link.href === "/claims"
              ? pathname === "/claims" || pathname.startsWith("/claims/") && pathname !== "/claims/new"
              : link.href === "/"
                ? pathname === "/"
                : pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`nav-link ${active ? "active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                <span className="nav-icon" aria-hidden="true">{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-foot">
          <strong className="block text-white">Staff claims</strong>
          A quieter way to keep things moving.
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="mobile-header">
          <Link className="brand" href="/">
            <span className="brand-mark">f.</span> fieldnote
          </Link>
          <button className="mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Open navigation">☰</button>
        </header>
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
