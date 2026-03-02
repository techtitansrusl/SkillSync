import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    const recruiters = await prisma.recruiter.findMany();
    console.log("Recruiters:", JSON.stringify(recruiters, null, 2));
}

check().finally(() => prisma.$disconnect());
