import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    try {
        console.log('Starting job deletion...');

        // Delete associated data first
        await prisma.result.deleteMany();
        await prisma.cv.deleteMany();
        await prisma.jobQualification.deleteMany();
        await prisma.jobSkill.deleteMany();

        // Delete jobs
        const { count } = await prisma.job.deleteMany();

        console.log(`Job deletion successful! Removed ${count} jobs.`);
    } catch (error) {
        console.error('Error during job deletion:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
