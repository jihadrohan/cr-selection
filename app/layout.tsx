import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClassVote — CR Election",
  description: "A simple online class representative election system"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
