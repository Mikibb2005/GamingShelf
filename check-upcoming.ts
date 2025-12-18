import { prisma } from "./src/lib/prisma";

async function check() {
    const lookup = await prisma.gameCatalog.findFirst({
        where: { title: { contains: "Grand Theft Auto VI" } }
    });
    console.log("¿Está GTA VI?:", lookup ? "SÍ" : "NO", lookup?.title);
}

check().finally(() => prisma.$disconnect());
