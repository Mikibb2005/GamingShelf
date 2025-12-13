import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    // Create default categories
    const categories = [
        { name: "General", description: "Discusiones generales sobre videojuegos", icon: "💬", order: 0 },
        { name: "Ayuda", description: "¿Necesitas ayuda? Pregunta aquí", icon: "❓", order: 1 },
        { name: "Logros", description: "Comparte tus logros y achievements", icon: "🏆", order: 2 },
        { name: "Retro", description: "Juegos clásicos y retro gaming", icon: "🕹️", order: 3 },
        { name: "Off-Topic", description: "Todo lo demás", icon: "☕", order: 4 }
    ];

    for (const cat of categories) {
        await prisma.forumCategory.upsert({
            where: { name: cat.name },
            update: {},
            create: cat
        });
    }

    return NextResponse.json({ success: true, message: "Categorías creadas" });
}
