import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function cleanup() {
    try {
        // Delete jobs with special title or from seed recruiter
        const deleted = await prisma.job.deleteMany({
            where: {
                title: 'Frontend Developer',
                recruiter: {
                    user: {
                        email: 'recruiter@example.com'
                    }
                }
            }
        });
        console.log(`Deleted ${deleted.count} sample jobs.`);
    } catch (error) {
        console.error("Cleanup failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanup();
