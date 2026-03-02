import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function reset() {
    console.log("Cleaning all data from the database...");
    try {
        await prisma.otp.deleteMany();
        await prisma.result.deleteMany();
        await prisma.cv.deleteMany();
        await prisma.jobSkill.deleteMany();
        await prisma.jobQualification.deleteMany();
        await prisma.job.deleteMany();
        await prisma.applicant.deleteMany();
        await prisma.recruiter.deleteMany();
        await prisma.user.deleteMany();
        console.log("Database cleanup complete!");
    } catch (error) {
        console.error("Reset failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

reset();
