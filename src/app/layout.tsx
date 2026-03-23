import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProdMind AI - AI Copilot for Product Managers",
  description:
    "An AI copilot that thinks like a product manager. From user insights to PRD generation and priority decisions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}
