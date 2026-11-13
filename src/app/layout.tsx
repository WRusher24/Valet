import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Valet — Menswear Colour Lookbook", template: "%s · Valet" },
  description:
    "Fast visual colour-palette inspiration and real menswear outfit references for office and smart-casual dressing.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#050206",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
