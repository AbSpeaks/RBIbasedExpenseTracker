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
  title: "ABIN GOVERNMENT | Financial OS",
  description: "Personal Financial Operating System - RBI Grade",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} antialiased`}>
        <ToastProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main
              className="main-content flex-1 min-h-screen pb-20 md:pb-6 md:ml-56"
              style={{ padding: "24px" }}
            >
              <div className="max-w-7xl mx-auto">{children}</div>
            </main>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
