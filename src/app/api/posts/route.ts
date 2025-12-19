import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const POST = auth(async function POST(req) {
    try {
        const userId = req.auth?.user?.id;
        if (!userId) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 });
        }

        const { imageUrl, caption } = await req.json();

        if (!imageUrl) {
            return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
        }

        const post = await prisma.post.create({
            data: {
                userId,
                imageUrl,
                caption,
            }
        });

        return NextResponse.json(post);
    } catch (error) {
        console.error("POST /api/posts error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
});
