import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VSL Builder",
  description: "Video Sales Letter Landing Page Builder",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
