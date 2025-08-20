import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AppInitializer from "@/components/AppInitializer";
import AdminKeyboardShortcut from "@/components/AdminKeyboardShortcut";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NODE_ENV === 'production' ? 'https://juelzs.dev' : 'http://localhost:3000'),
  title: {
    default: "Juelzs - Systems Architect & AI Strategist",
    template: "%s | Juelzs"
  },
  description: "Systems architect, AI strategist, and technical leader building intelligent, modular architectures that think. Helping teams scale through better systems design.",
  keywords: [
    "systems architect",
    "AI strategist",
    "technical leadership",
    "modular architecture",
    "team coaching",
    "system design"
  ],
  authors: [{ name: "Juelzs" }],
  creator: "Juelzs",
  icons: {
    icon: [
      { url: "/profile-logo.png?v=3", sizes: "32x32", type: "image/png" },
      { url: "/profile-logo.png?v=3", sizes: "16x16", type: "image/png" },
      { url: "/profile-logo.png?v=3", sizes: "48x48", type: "image/png" },
      { url: "/profile-logo.png?v=3", sizes: "any", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" }
    ],
    apple: [
      { url: "/profile-logo.png", sizes: "180x180", type: "image/png" }
    ],
    shortcut: "/profile-logo.png?v=3",
    other: [
      {
        rel: "mask-icon",
        url: "/profile-logo.png?v=3",
        color: "#3b82f6",
      },
    ]
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://juelzs.dev",
    title: "Juelzs - Systems Architect & AI Strategist",
    description: "Building intelligent, modular architectures that think. Helping teams scale through better systems design.",
    siteName: "Juelzs Portfolio",
    images: [
      {
        url: "/profile-logo.png",
        width: 1200,
        height: 630,
        alt: "Juelzs - Systems Architect & AI Strategist",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Juelzs - Systems Architect & AI Strategist",
    description: "Building intelligent, modular architectures that think. Helping teams scale through better systems design.",
    creator: "@juelzs",
    images: ["/profile-logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-900 text-gray-100`}
      >
        <AppInitializer />
        <AdminKeyboardShortcut />
        <Header />
        <main className="min-h-screen pt-16">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
