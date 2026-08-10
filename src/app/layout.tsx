import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { ToastProvider } from "@/components/ui/Toast";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter", 
});

const playfair = Playfair_Display({ 
  subsets: ["latin"],
  variable: "--font-playfair", 
});

export const metadata: Metadata = {
  title: "RESERVE BANK OF ABIN | Financial OS",
  description: "Personal Financial Operating System - RBI Grade",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "RBI OS",
    statusBarStyle: "black-translucent",
  },
};

export const viewport = {
  themeColor: "#070D19",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevents zooming on mobile
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} antialiased`}>
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js');
              });
            }
          `
        }} />
        <ToastProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main
              className="main-content flex-1 min-h-screen pb-20 md:pb-6 md:ml-56 p-3 md:p-6"
              className="p-3 md:p-6"
            >
              <div className="max-w-7xl mx-auto">{children}</div>
            </main>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
