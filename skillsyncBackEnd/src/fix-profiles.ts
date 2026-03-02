import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixMissingProfiles() {
    console.log("Checking for missing Applicant/Recruiter records...");
    const users = await prisma.user.findMany();
    let fixedCount = 0;

    for (const user of users) {
        if (user.role === 'APPLICANT') {
            const applicant = await prisma.applicant.findUnique({
                where: { id: user.id }
            });
            if (!applicant) {
                console.log(`Creating missing Applicant record for: ${user.name} (${user.email})`);
                await prisma.applicant.create({
                    data: { id: user.id }
                });
                fixedCount++;
            }
        } else if (user.role === 'RECRUITER') {
            const recruiter = await prisma.recruiter.findUnique({
                where: { id: user.id }
            });
            if (!recruiter) {
                console.log(`Creating missing Recruiter record for: ${user.name} (${user.email})`);
                await prisma.recruiter.create({
                    data: { id: user.id, companyName: 'Unspecified' }
                });
                fixedCount++;
            }
        }
    }

    console.log(`Done. Fixed ${fixedCount} records.`);
    await prisma.$disconnect();
}

fixMissingProfiles().catch(e => {
    console.error(e);
    process.exit(1);
});
