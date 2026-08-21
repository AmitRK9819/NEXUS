import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import AppNav from "@/components/AppNav";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Policy Intelligence Platform",
  description:
    "Transparent, human-in-the-loop AI decision support platform for government policymakers.",
  keywords: [
    "GovTech",
    "Policymaker",
    "AI",
    "Explainable AI",
    "Decision Support",
    "Government",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <StoreProvider>
          <AppNav />
          <div className="flex min-h-screen flex-col">
            <main id="main-content" className="flex-1">
              {children}
            </main>
            <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
              <span>Policy Intelligence Platform</span>
              <span className="mx-2 text-slate-300">|</span>
              <span>Government of India — Digital Governance Initiative</span>
              <span className="mx-2 text-slate-300">|</span>
              <span>All decisions require human review and authorisation.</span>
            </footer>
          </div>
        </StoreProvider>
      </body>
    </html>
  );
}
