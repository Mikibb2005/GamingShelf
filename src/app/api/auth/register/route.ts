import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { validatePassword, getPasswordRequirements } from "@/lib/password-validation";

export async function POST(request: Request) {
    try {
        const { username, email, password } = await request.json();

        if (!username || !email || !password) {
            return NextResponse.json(
                { error: "Todos los campos son requeridos" },
                { status: 400 }
            );
        }

        // Validate password strength
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            return NextResponse.json(
                {
                    error: passwordValidation.errors[0],
                    requirements: getPasswordRequirements()
                },
                { status: 400 }
            );
        }

        // Check if user exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ email }, { username }]
            }
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "El usuario o email ya existe" },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword
            }
        });

        return NextResponse.json({
            id: user.id,
            username: user.username,
            email: user.email
        });
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "Error al registrar usuario" },
            { status: 500 }
        );
    }
}
