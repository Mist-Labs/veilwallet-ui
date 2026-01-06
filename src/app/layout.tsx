import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VeilWallet - Privacy-First Account Abstraction Wallet",
  description: "Privacy-first Account Abstraction wallet for Mantle with private balance visibility and gasless transactions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=400, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style dangerouslySetInnerHTML={{__html: `
          html, body {
            width: 400px !important;
            height: 600px !important;
            min-width: 400px !important;
            min-height: 600px !important;
            max-width: 400px !important;
            max-height: 600px !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
          }
          #__next {
            width: 400px !important;
            height: 600px !important;
            min-width: 400px !important;
            min-height: 600px !important;
          }
        `}} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
