
import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Instagram Clone",
  description: "Share photos, videos and moments with friends.",
};

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#000000] text-white antialiased">
        <Suspense fallback={<div className="h-16 bg-black" />}>
          <Navbar />
        </Suspense>

        <main className="min-h-[calc(100vh-64px)] w-full bg-black">
          {children}
        </main>
      </body>
    </html>
  );
}
