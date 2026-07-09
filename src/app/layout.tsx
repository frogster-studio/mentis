import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Body text — Poppins Regular, self-hosted from /public/fonts
const poppins = localFont({
  src: "../../public/fonts/poppins-regular.ttf",
  variable: "--font-sans",
  weight: "400",
  display: "swap",
});

// Titles / headings — Lexend Bold, self-hosted from /public/fonts
const lexend = localFont({
  src: "../../public/fonts/lexend-bold.ttf",
  variable: "--font-heading",
  weight: "700",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mentis",
  description: "Back-office for the Mentis Card library",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${lexend.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
