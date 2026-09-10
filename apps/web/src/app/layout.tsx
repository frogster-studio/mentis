import type { Metadata } from "next";
import localFont from "next/font/local";
import type { PropsWithChildren } from "react";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";

const poppins = localFont({
  src: "../../public/fonts/poppins-regular.ttf",
  variable: "--font-sans",
  weight: "400",
  display: "swap",
});

const lexend = localFont({
  src: "../../public/fonts/lexend-bold.ttf",
  variable: "--font-heading",
  weight: "700",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Frogster Studio",
  description: "Frogster Studio conçoit des applications mobiles de jeu, dont Mentis.",
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="fr" className={`${poppins.variable} ${lexend.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
