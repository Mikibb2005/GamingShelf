import { prisma } from "./src/lib/prisma";
import bcrypt from "bcryptjs";

async function test() {
    try {
        const password = "Pass1234";
        console.log("Hashing password...");
        const hashedPassword = await bcrypt.hash(password, 12);
        console.log("Hashed:", hashedPassword);

        console.log("Connecting to DB...");
        const user = await prisma.user.findFirst();
        console.log("Success! Found user:", user ? user.username : "No users yet");
    } catch (e) {
        console.error("Error during test:", e);
    } finally {
        await prisma.$disconnect();
    }
}

test();
