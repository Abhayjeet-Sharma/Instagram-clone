
import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Luma",
  description: "Share photos, videos and moments with friends.",
};

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html lang="en" className="dark">
      

<body className="min-h-screen text-white antialiased luma-body">
  {/* Global animated background */}
  <div className="luma-atmosphere" aria-hidden="true">
    <div className="luma-wave luma-wave-one" />
    <div className="luma-wave luma-wave-two" />
    <div className="luma-glitter" />
  </div>

  {/* Application content */}
  <div className="relative z-10">
    <Suspense fallback={<div className="h-16" />}>
      <Navbar />
    </Suspense>

    <main className="min-h-[calc(100vh-64px)] w-full">
      {children}
    </main>
  </div>
</body>


    </html>
  );
}
