import { prisma } from "./src/lib/prisma";

async function clearUsers() {
    console.log("🧹 Borrando todos los usuarios y sus datos asociados (limpieza total)...");

    try {
        // En Prisma, borrar User borrará en cascada los datos dependientes si están así configurados,
        // pero para estar seguros y evitar errores de claves foráneas, borramos en orden.

        await prisma.comment.deleteMany({});
        await prisma.message.deleteMany({});
        await prisma.post.deleteMany({});
        await prisma.forumReply.deleteMany({});
        await prisma.forumTopic.deleteMany({});
        await prisma.follow.deleteMany({});
        await prisma.game.deleteMany({});
        await prisma.linkedAccount.deleteMany({});
        await prisma.ignoredGame.deleteMany({});
        await prisma.showcase.deleteMany({});

        const { count } = await prisma.user.deleteMany({});

        console.log(`✅ ¡Limpieza completada! Se han eliminado ${count} usuarios.`);
        console.log("El catálogo de juegos se ha mantenido intacto.");
    } catch (e) {
        console.error("❌ Error durante la limpieza:", e);
    } finally {
        await prisma.$disconnect();
    }
}

clearUsers();
