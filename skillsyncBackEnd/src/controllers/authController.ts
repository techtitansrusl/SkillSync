
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

export const register = async (req: Request, res: Response) => {
    const { name, email, password, role, companyName } = req.body;

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Transaction to ensure both user and specific role record are created
        const result = await prisma.$transaction(async (prisma) => {
            const user = await prisma.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    role: role || 'APPLICANT',
                },
            });

            if (user.role === 'RECRUITER') {
                await prisma.recruiter.create({
                    data: {
                        id: user.id,
                        companyName: companyName || 'Unspecified'
                    }
                });
            } else {
                await prisma.applicant.create({
                    data: {
                        id: user.id,
                        resumeUrl: null
                    }
                });
            }
            return user;
        });

        const token = jwt.sign({ id: result.id, email: result.email, role: result.role }, JWT_SECRET, { expiresIn: '1h' });
        res.status(201).json({ token, user: { id: result.id, name: result.name, email: result.email, role: result.role } });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(400).json({ error: error instanceof Error ? error.message : 'Registration failed' });
    }
};

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(400).json({ error: 'User not found' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
};
