"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const pages = [
  { href: "/", label: "Command Center" },
  { href: "/incidents", label: "Incidents" },
  { href: "/investigations", label: "Investigations" },
  { href: "/actions", label: "Actions" }
];

export function SiteNavigation() {
  const pathname = usePathname();
  return <nav className="siteNavigation" aria-label="Main navigation">
    {pages.map(({ href, label }) =>
      <Link key={href} href={href} className={pathname === href ? "nav active" : "nav"} aria-current={pathname === href ? "page" : undefined}>
        {label}
      </Link>
    )}
  </nav>;
}
