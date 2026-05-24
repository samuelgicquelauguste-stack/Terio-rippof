import type { Metadata } from "next";
// @ts-ignore
import "./globals.css";

export const metadata: Metadata = {
  title: "Multiplayer Tetris",
  description: "Play Tetris with your friends online",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Forces Tailwind styles to inject and execute immediately without config files */}
        <script src="https://tailwindcss.com"></script>
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
