import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MainLayout } from "@/components/layout";
import { AuthProvider } from "@/lib/auth/useAuth";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import { Toaster } from "sonner";
import { LayoutContent } from "@/components/layout/LayoutContent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Optical Fiber Business Case - Project Management",
  description: "Professional fiber optic project management and cost calculation platform for Bangladesh market",
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
      >
        <ThemeProvider defaultTheme="system" storageKey="of-theme">
          <AuthProvider>
            <LayoutContent>{children}</LayoutContent>
            <Toaster 
              position="top-right" 
              richColors 
              expand={true}
              closeButton
              className="bg-background/95 backdrop-blur-md"
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
