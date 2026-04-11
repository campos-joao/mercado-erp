import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mercado ERP - Sistema de Gestão",
  description: "Sistema de Gestão de Mercado com entrada automática de NF-e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={cn("font-sans", geist.variable)}>
      <body className={inter.className}>
        <Sidebar />
        <main className="ml-64 min-h-screen bg-background p-6">
          {children}
        </main>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
