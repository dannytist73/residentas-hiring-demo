import "./globals.css";
import type { Metadata } from "next";
import { display, sans } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "Residentas — Hiring",
  description: "Two cities. One standard of living.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="bg-bg text-ink font-sans antialiased">{children}</body>
    </html>
  );
}
