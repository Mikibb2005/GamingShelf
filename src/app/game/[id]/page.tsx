"use client";

import { useParams } from "next/navigation";
import CatalogGameDetail from "@/components/CatalogGameDetail";

/**
 * Library Game Detail Page
 * 
 * This page serves as a full-screen wrapper for the unified CatalogGameDetail component
 * in 'library' mode. All functional logic (playtime, progress, bitácora, deletion) 
 * is now centrally managed by the component to ensure a 100% consistent premium experience.
 */
export default function GameDetailPage() {
    const params = useParams();
    const id = params?.id as string;

    if (!id) return null;

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
            <CatalogGameDetail id={id} variant="library" />
        </div>
    );
}
