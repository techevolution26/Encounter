//src/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/Components/AuthProvider";
import Header from "@/Components/Header";
import "./globals.css";

// 1. Configure Fonts with CSS variables for Tailwind integration
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 2. Define SEO Metadata
export const metadata: Metadata = {
  title: "Encounter",
  description: "Meet With Christ Daily",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`
          ${geistSans.variable}
          ${geistMono.variable}
          antialiased 
          bg-gray-50 
          text-gray-900
        `}
      >
        {/* Wrap application in Auth Provider */}
        <AuthProvider>
          <Header />
          <main className="container mx-auto px-4 py-6">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
