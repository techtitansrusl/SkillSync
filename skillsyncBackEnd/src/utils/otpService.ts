
import { prisma } from '../index';
import crypto from 'crypto';
import { sendEmail } from './emailService';

export const generateOtp = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const saveAndSendOtp = async (email: string) => {
    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Clear existing OTPs for this email to avoid clutter
    await prisma.otp.deleteMany({ where: { email } });

    await prisma.otp.create({
        data: {
            email,
            code,
            expiresAt,
        },
    });

    const subject = 'Your SkillSync OTP Verification Code';
    const text = `Your OTP code is: ${code}. It expires in 15 minutes.`;
    const html = `<p>Your OTP code is: <strong>${code}</strong>. It expires in 15 minutes.</p>`;

    await sendEmail(email, subject, text, html);
};

export const checkOtpStatus = async (email: string, code: string): Promise<'valid' | 'invalid' | 'expired'> => {
    const otpRecord = await prisma.otp.findFirst({
        where: { email, code }
    });

    if (!otpRecord) return 'invalid';

    if (otpRecord.expiresAt < new Date()) {
        return 'expired';
    }

    return 'valid';
};

export const verifyOtp = async (email: string, code: string): Promise<boolean> => {
    const status = await checkOtpStatus(email, code);

    if (status === 'valid') {
        // Delete the OTP after successful verification
        await prisma.otp.deleteMany({ where: { email, code } });
        return true;
    }

    return false;
};
