import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CinemaOS",
  description: "Turn your imagination into cinema.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-cinematic antialiased">{children}</body>
    </html>
  );
}
