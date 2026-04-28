import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ChatWrapper } from "@/components/ChatWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FinCortex - AI-Powered Reimbursement Management",
  description: "Streamline expense claims with intelligent OCR and automated workflows. Professional, mobile-first reimbursement management system.",
  keywords: "reimbursement, expense management, AI, OCR, mobile, professional",
  authors: [{ name: "FinCortex Team" }],
  robots: "index, follow",
  openGraph: {
    title: "FinCortex - AI-Powered Reimbursement Management",
    description: "Streamline expense claims with intelligent OCR and automated workflows",
    type: "website",
    locale: "en_US",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <AuthProvider>
            {children}
            <ChatWrapper />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
