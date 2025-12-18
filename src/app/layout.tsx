import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Providers from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "GamingShelf",
    description: "Todo tu juego en un lugar. Organiza tu colección de videojuegos, sincroniza con Steam, Xbox y RetroAchievements.",
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: "#050505",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es">
            <body className={inter.className}>
                <Providers>
                    <div className="app-shell">
                        <Navigation />
                        <main className="main-content">
                            {children}
                        </main>
                    </div>
                </Providers>
            </body>
        </html>
    );
}
