import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    try {
        console.log('Starting database cleanup...');

        // Delete in order to satisfy foreign key constraints
        await prisma.result.deleteMany();
        await prisma.cv.deleteMany();
        await prisma.jobQualification.deleteMany();
        await prisma.jobSkill.deleteMany();
        await prisma.job.deleteMany();
        await prisma.applicant.deleteMany();
        await prisma.recruiter.deleteMany();
        await prisma.user.deleteMany();

        console.log('Database cleanup successful! All records removed.');
    } catch (error) {
        console.error('Error during cleanup:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
