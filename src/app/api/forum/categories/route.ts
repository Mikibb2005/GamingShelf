import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: List all categories with topic counts
export async function GET() {
    const categories = await prisma.forumCategory.findMany({
        include: {
            _count: { select: { topics: true } }
        },
        orderBy: { order: 'asc' }
    });

    return NextResponse.json(categories);
}

// POST: Create a new category (admin only in the future)
export async function POST(request: Request) {
    const { name, description, icon } = await request.json();

    if (!name) {
        return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
    }

    const category = await prisma.forumCategory.create({
        data: { name, description, icon }
    });

    return NextResponse.json(category);
}
