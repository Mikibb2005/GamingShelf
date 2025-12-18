import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { getCatalogGame } from "@/lib/data-service";
import CatalogGameDetail from "@/components/CatalogGameDetail";

export const revalidate = 86400;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const game = await getCatalogGame(id);
    return {
        title: `${game?.title || 'Juego'} | GamingShelf`,
    };
}

export default async function CatalogDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // We can reuse the client component but in "page" mode if we want, 
    // OR just render the premium UI here for SEO/Server-side benefits.
    // For now, let's use the client component 'CatalogGameDetail' which 
    // we already perfected, but we need to tell it it's NOT a modal.

    // Actually, let's just render the same layout logic but as a page.
    // To avoid duplication, I'll update CatalogGameDetail to support a "static" mode 
    // or just make this page a wrapper that triggers the modal logic but full-screen.

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
            <CatalogGameDetail id={id} onCloseRedirect="/catalog" />
        </div>
    );
}

