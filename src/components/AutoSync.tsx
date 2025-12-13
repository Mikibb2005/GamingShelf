"use client";

import { useEffect } from "react";

export default function AutoSync() {
    useEffect(() => {
        // Trigger sync check on mount
        // The API itself handles the 48h check, so we can call this safely on every load
        // It runs in background (we don't await/block UI)
        fetch("/api/system/sync")
            .then(async (res) => {
                const data = await res.json();
                if (data.skipped) {
                    console.log(`[AutoSync] Skipped (Next sync in ${Math.round(data.nextSyncDiff / 1000 / 60)} mins)`);
                } else if (data.success) {
                    console.log(`[AutoSync] Synced ${data.count} new games`);
                }
            })
            .catch(console.error);
    }, []);

    return null;
}
