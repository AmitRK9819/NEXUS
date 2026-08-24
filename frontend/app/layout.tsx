import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppNav from "@/components/AppNav";
import { StoreProvider } from "@/lib/store";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NEXUS — AI Digital Public Infrastructure & Sovereign Planning",
  description:
    "AI-native Digital Public Infrastructure (DPI) & Governance platform bridging citizen grievance reporting and sovereign infrastructure planning.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-slate-100 font-sans text-slate-900 antialiased">
        <StoreProvider>
          <div className="flex min-h-screen flex-col">
            <AppNav />
            <main className="flex-1" id="main-content" tabIndex={-1}>
              {children}
            </main>
          </div>
        </StoreProvider>
      </body>
    </html>
  );
}
