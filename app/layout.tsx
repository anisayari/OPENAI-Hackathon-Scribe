import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Video Script & Storyboard Generator",
  description: "Create compelling video scripts and storyboards with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://use.typekit.net/xtq8vic.css" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
