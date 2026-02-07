import type { Metadata } from "next";
import { Outfit, Geist_Mono } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Menu Analyzer | AI-Powered Food Recommendations",
  description: "Upload restaurant menu images and get personalized AI food recommendations tailored to your health and fitness goals.",
  keywords: ["menu analyzer", "food recommendations", "nutrition", "AI", "health goals"],
  authors: [{ name: "AR" }],
  openGraph: {
    title: "Menu Analyzer | AI-Powered Food Recommendations",
    description: "Get personalized food recommendations from any restaurant menu",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${geistMono.variable} antialiased`}>
        {/* Aurora Background */}
        <div className="aurora-bg" aria-hidden="true" />
        <div className="grid-pattern" aria-hidden="true" />
        
        {/* Floating Decorative Orbs */}
        <div className="floating-orb orb-1" aria-hidden="true" />
        <div className="floating-orb orb-2" aria-hidden="true" />
        <div className="floating-orb orb-3" aria-hidden="true" />
        
        {children}
      </body>
    </html>
  );
}
