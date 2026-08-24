import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "NEXUS — Citizen Demand Hotspot Map",
  description:
    "AI-powered geospatial platform mapping citizen infrastructure demand across BRICS nations for policymaker action.",
  keywords: ["BRICS", "infrastructure", "AI", "public governance", "heatmap", "DPI"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-950 text-white">{children}</body>
    </html>
  );
}
