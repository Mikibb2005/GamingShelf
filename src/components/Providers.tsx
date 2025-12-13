"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { useEffect, useRef } from "react";

function AutoSync({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const hasSynced = useRef(false);

    useEffect(() => {
        // Only sync once per session, when user is authenticated
        if (status === "authenticated" && session?.user && !hasSynced.current) {
            hasSynced.current = true;

            // Sync RetroAchievements in background
            fetch("/api/integrations/retroachievements", { method: "POST" })
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.imported > 0) {
                        console.log(`✅ Auto-synced ${data.imported} games from RA`);
                    }
                })
                .catch(() => {
                    // Silent fail - user may not have RA linked
                });

            // Sync Steam in background
            fetch("/api/integrations/steam", { method: "POST" })
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.imported > 0) {
                        console.log(`✅ Auto-synced ${data.imported} games from Steam`);
                    }
                })
                .catch(() => {
                    // Silent fail - user may not have Steam linked
                });
        }
    }, [status, session]);

    return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <AutoSync>{children}</AutoSync>
        </SessionProvider>
    );
}
