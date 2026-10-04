import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "SentinelOS Command Center",
  description: "Detect. Investigate. Resolve."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
