import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function dumpDB() {
    console.log("--- Users ---");
    const users = await prisma.user.findMany({ select: { id: true, email: true, role: true } });
    console.log(users);

    console.log("--- Applicants ---");
    const applicants = await prisma.applicant.findMany({ select: { id: true } });
    console.log(applicants);

    console.log("--- recruiters ---");
    const recruiters = await prisma.recruiter.findMany({ select: { id: true } });
    console.log(recruiters);

    await prisma.$disconnect();
}

dumpDB().catch(console.error);
