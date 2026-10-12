import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "SentinelOS",
  title: {
    default: "SentinelOS | Operations Intelligence",
    template: "%s | SentinelOS"
  },
  description: "Inspect project source, review operational signals, and coordinate incident investigations in one workspace.",
  robots: { index: false, follow: false },
  icons: { icon: "/favicon.svg" }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
