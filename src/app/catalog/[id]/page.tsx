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

    /**
     * Catalog Game Detail Page
     * 
     * This page serves as a full-screen wrapper for the unified CatalogGameDetail component.
     * It provides a consistent premium experience as the modal view but in a standalone route.
     */
    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
            <CatalogGameDetail id={id} variant="catalog" onCloseRedirect="/catalog" />
        </div>
    );
}
