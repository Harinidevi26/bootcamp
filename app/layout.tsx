import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/contexts/CartContext";
import CartDrawer from "@/components/CartDrawer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ShopSphere",
    template: "%s | ShopSphere",
  },
  description: "Explore our premium collection of electronics, accessories, footwear, bags, and home goods.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: {
      default: "ShopSphere",
      template: "%s | ShopSphere",
    },
    description: "Explore our premium collection of electronics, accessories, footwear, bags, and home goods.",
    url: "https://shopsphere.example.com",
    siteName: "ShopSphere",
    images: [
      {
        url: "https://shopsphere.example.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ShopSphere Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: {
      default: "ShopSphere",
      template: "%s | ShopSphere",
    },
    description: "Explore our premium collection of electronics, accessories, footwear, bags, and home goods.",
    images: ["https://shopsphere.example.com/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
