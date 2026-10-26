import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mini Bank • Simple, Secure & Fast",
  description: "A modern, mobile-first banking platform built with shadcn/ui and pure monochrome aesthetics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased font-sans">
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
