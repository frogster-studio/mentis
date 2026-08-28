import type { Metadata } from "next";
import localFont from "next/font/local";
import type { PropsWithChildren } from "react";
import "./globals.css";
import { Providers } from "./providers";

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

// Curation previews Category glyphs, so the icon webfont ships beside the glyphmap it is indexed by.
const materialIcons = localFont({
  src: "../../public/fonts/material-icons.ttf",
  variable: "--font-icons",
  weight: "400",
  display: "block",
  preload: false,
});

export const metadata: Metadata = {
  title: "Mentis",
  description: "Mentis back-office",
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${lexend.variable} ${materialIcons.variable} h-full antialiased`}
    >
      <body className="h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
