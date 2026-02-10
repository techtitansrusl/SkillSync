import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    const jobs = await prisma.job.findMany({
        select: { id: true, title: true, recruiter: { select: { user: { select: { email: true } } } } }
    });
    console.log("Jobs in DB:", JSON.stringify(jobs, null, 2));
}

check().finally(() => prisma.$disconnect());
