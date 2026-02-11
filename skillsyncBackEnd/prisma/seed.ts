import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
    const prisma = new PrismaClient();
    try {
        const hashedPassword = await bcrypt.hash('password123', 10);

        // Create Applicant User
        const applicantUser = await prisma.user.upsert({
            where: { email: 'applicant@example.com' },
            update: {},
            create: {
                email: 'applicant@example.com',
                name: 'John Applicant',
                password: hashedPassword,
                role: 'APPLICANT',
            },
        });

        // Create Applicant Profile
        await prisma.applicant.upsert({
            where: { id: applicantUser.id },
            update: {},
            create: {
                id: applicantUser.id,
                resumeUrl: null
            }
        });

        // Create Recruiter User
        const recruiterUser = await prisma.user.upsert({
            where: { email: 'recruiter@example.com' },
            update: {},
            create: {
                email: 'recruiter@example.com',
                name: 'Sarah Recruiter',
                password: hashedPassword,
                role: 'RECRUITER',
            },
        });

        // Create Recruiter Profile
        await prisma.recruiter.upsert({
            where: { id: recruiterUser.id },
            update: {},
            create: {
                id: recruiterUser.id,
                companyName: 'Tech Corp'
            }
        });

        // Create Job (Optional: only if no jobs exist)
        let job = null;
        const jobCount = await prisma.job.count();
        if (jobCount === 0) {
            job = await prisma.job.create({
                data: {
                    title: 'Frontend Developer',
                    recruiterId: recruiterUser.id,
                    location: 'Remote',
                    description: 'We are looking for a React expert.',
                    status: 'ACTIVE',
                    qualifications: {
                        create: [
                            { qualification: '3+ years experience' },
                            { qualification: 'Bachelor degree in CS' }
                        ]
                    },
                    skills: {
                        create: [
                            { skill: 'React' },
                            { skill: 'TypeScript' },
                            { skill: 'Tailwind' }
                        ]
                    }
                },
            });
            console.log("Seeded initial job:", job.title);
        } else {
            console.log("Jobs already exist, skipping initial job seeding.");
        }

        console.log({ applicantUser, recruiterUser, job });
    } finally {
        await prisma.$disconnect();
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
