import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { saveAndSendOtp, verifyOtp, checkOtpStatus } from '../utils/otpService';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

export const register = async (req: Request, res: Response) => {
    const { name, email, password, role, companyName } = req.body;

    // Password strength validation
    if (password.length < 8) {
        return res.status(400).json({ error: 'Password too short (minimum 8 characters)', errorCode: 202 });
    }

    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!strongPasswordRegex.test(password)) {
        return res.status(400).json({ error: 'Weak password (must include uppercase, lowercase, number, and special character)', errorCode: 201 });
    }

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

            // Save initial password to history
            await prisma.passwordHistory.create({
                data: {
                    userId: user.id,
                    password: hashedPassword
                }
            });

            return user;
        });

        const token = jwt.sign({ id: result.id, email: result.email, role: result.role, isVerified: result.isVerified }, JWT_SECRET, { expiresIn: '15m' });

        // Send OTP for verification
        await saveAndSendOtp(result.email);

        res.status(201).json({
            message: 'Registration successful. Please verify your email with the OTP sent.',
            token,
            user: { id: result.id, name: result.name, email: result.email, role: result.role, isVerified: result.isVerified }
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(400).json({ error: error instanceof Error ? error.message : 'Registration failed' });
    }
};

export const verifyUserOtp = async (req: Request, res: Response) => {
    const { email, code } = req.body;
    try {
        const status = await checkOtpStatus(email, code);

        if (status === 'invalid') {
            return res.status(400).json({ error: 'Invalid token', errorCode: 204 });
        }

        if (status === 'expired') {
            return res.status(400).json({ error: 'Expired link', errorCode: 205 });
        }

        // Token is valid, now we can proceed (it will be deleted by verifyOtp)
        await verifyOtp(email, code);

        await prisma.user.update({
            where: { email },
            data: { isVerified: true },
        });

        res.json({ message: 'Email verified successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Verification failed' });
    }
};

export const resendOtp = async (req: Request, res: Response) => {
    const { email } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        await saveAndSendOtp(email);
        res.json({ message: 'OTP resent successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to resend OTP' });
    }
};

export const forgotPassword = async (req: Request, res: Response) => {
    const { email } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        await saveAndSendOtp(email);
        res.json({ message: 'Password reset OTP sent to your email' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to process request' });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    const { email, code, newPassword } = req.body;
    try {
        const status = await checkOtpStatus(email, code);

        if (status === 'invalid') {
            return res.status(400).json({ error: 'Invalid token', errorCode: 204 });
        }

        if (status === 'expired') {
            return res.status(400).json({ error: 'Expired link', errorCode: 205 });
        }

        // Valid token, proceed to delete and reset
        await verifyOtp(email, code);

        // Password strength validation
        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'Password too short (minimum 8 characters)', errorCode: 202 });
        }

        const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!strongPasswordRegex.test(newPassword)) {
            return res.status(400).json({ error: 'Weak password (must include uppercase, lowercase, number, and special character)', errorCode: 201 });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { email },
            data: {
                password: hashedPassword,
                isVerified: true, // Also verify if not already
                isLocked: false, // Unlock on password reset
                loginAttempts: 0 // Reset attempts
            },
        });

        // Save to password history
        const user = await prisma.user.findUnique({ where: { email } });
        if (user) {
            await prisma.passwordHistory.create({
                data: {
                    userId: user.id,
                    password: hashedPassword
                }
            });

            // Keep only last 3
            const history = await prisma.passwordHistory.findMany({
                where: { userId: user.id },
                orderBy: { createdAt: 'desc' }
            });
            if (history.length > 3) {
                await prisma.passwordHistory.delete({ where: { id: history[history.length - 1].id } });
            }
        }

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        res.status(500).json({ error: 'Password reset failed' });
    }
};

export const login = async (req: Request, res: Response) => {
    const { email, password, role } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(400).json({ error: 'User not found' });

        // Role enforcement
        if (role && user.role !== role) {
            const roleName = user.role.charAt(0) + user.role.slice(1).toLowerCase();
            return res.status(400).json({
                error: `This account is registered as a ${roleName}. Please login as a ${roleName}.`,
                errorCode: 403
            });
        }

        if (!user.isVerified) {
            return res.status(403).json({ error: 'Email not verified. Please verify your email first.', email: user.email });
        }

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            // Increment failed attempts
            const newAttempts = user.loginAttempts + 1;
            const isLocked = newAttempts >= 3;

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    loginAttempts: newAttempts,
                    isLocked: isLocked
                }
            });

            if (isLocked) {
                return res.status(403).json({ error: 'Account locked due to 3 failed attempts. Please reset your password to unlock.', errorCode: 203 });
            }

            return res.status(400).json({ error: 'Invalid credentials', errorCode: 203 });
        }

        // Check if locked
        if (user.isLocked) {
            return res.status(403).json({ error: 'Account is locked. Please reset your password to unlock.', errorCode: 203 });
        }

        // On successful login, reset attempts
        await prisma.user.update({
            where: { id: user.id },
            data: { loginAttempts: 0 }
        });

        const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified } });
    } catch (error) {
        console.error("Login error details:", error);
        res.status(500).json({ error: 'Login failed' });
    }
};

export const changePassword = async (req: Request, res: Response) => {
    const { oldPassword, newPassword } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { passwordHistory: { orderBy: { createdAt: 'desc' }, take: 3 } }
        });

        if (!user) return res.status(404).json({ error: 'User not found' });

        // 1. Verify old password
        const isOldValid = await bcrypt.compare(oldPassword, user.password);
        if (!isOldValid) {
            return res.status(400).json({ error: 'Old password incorrect', errorCode: 601 });
        }

        // 2. Validate New password rules
        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'Password too short (minimum 8 characters)', errorCode: 602 });
        }

        const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!strongPasswordRegex.test(newPassword)) {
            return res.status(400).json({ error: 'Weak new password', errorCode: 602 });
        }

        // 3. Check against last 3 previously used passwords
        for (const record of user.passwordHistory) {
            const isMatch = await bcrypt.compare(newPassword, record.password);
            if (isMatch) {
                return res.status(400).json({ error: 'New password cannot match the last 3 previously used passwords' });
            }
        }

        // 4. Update credentials
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });

        // 5. Save to history and maintain limit of 3
        await prisma.passwordHistory.create({
            data: {
                userId,
                password: hashedPassword
            }
        });

        const history = await prisma.passwordHistory.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });

        if (history.length > 3) {
            for (let i = 3; i < history.length; i++) {
                await prisma.passwordHistory.delete({ where: { id: history[i].id } });
            }
        }

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Password update failed' });
    }
};
