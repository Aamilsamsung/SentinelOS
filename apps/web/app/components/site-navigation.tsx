"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const pages = [
  { href: "/", label: "Overview", mark: "▦" },
  { href: "/scan", label: "Source Inspector", mark: "◎" },
  { href: "/incidents", label: "Incidents", mark: "◇" },
  { href: "/investigations", label: "Investigations", mark: "⌁" },
  { href: "/actions", label: "Remediation", mark: "▤" },
  { href: "/integrations", label: "Integrations", mark: "⎇" }
];

export function SiteNavigation() {
  const pathname = usePathname();
  return <nav className="siteNavigation" aria-label="Main navigation">
    {pages.map(({ href, label, mark }) =>
      <Link key={href} href={href} className={pathname === href ? "nav active" : "nav"} aria-current={pathname === href ? "page" : undefined}>
        <span className="navMark" aria-hidden="true">{mark}</span><span>{label}</span>
        {href === "/scan" && <span className="navNew">NEW</span>}
      </Link>
    )}
  </nav>;
}
