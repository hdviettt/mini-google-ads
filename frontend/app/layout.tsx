import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mini Google Ads",
  description: "A working from-scratch mini Google Ads stack: auction, Quality Score, Smart Bidding ML.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
