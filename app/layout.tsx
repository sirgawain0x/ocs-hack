import type { Metadata } from "next";
import { Inter, Source_Code_Pro } from "next/font/google";
import { RootProvider } from "./rootProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const sourceCodePro = Source_Code_Pro({
  variable: "--font-source-code-pro",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BEATME",
  description: "Name that tune, win your reward",
  other: {
    "fc:frame": JSON.stringify({
      version: "next",
      imageUrl: "https://usdozf7pplhxfvrl.public.blob.vercel-storage.com/thumbnail_71c11dee-b398-4ff8-9e06-6a78958cd5cc-RUsgkllNAu2j9Yd4GgqronDXhWL88r",
      button: {
        title: "Drop the Beat",
        action: {
          type: "launch_frame",
          name: "BEATME",
          url: "https://beatme.creativeplatform.xyz",
          splashImageUrl: "https://usdozf7pplhxfvrl.public.blob.vercel-storage.com/farcaster/splash_images/splash_image1.svg",
          splashBackgroundColor: "#000000"
        }
      }
    })
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Audiowide&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.variable} ${sourceCodePro.variable} min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50`}>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
