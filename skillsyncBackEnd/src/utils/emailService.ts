
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const sendEmail = async (to: string, subject: string, text: string, html?: string) => {
    const mailOptions = {
        from: process.env.SMTP_FROM || '"SkillSync" <no-reply@skillsync.com>',
        to,
        subject,
        text,
        html,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: %s', info.messageId);
        // If using Ethereal, log the preview URL
        if (process.env.SMTP_HOST === 'smtp.ethereal.email') {
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        }
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};
export type NotificationType = 'CV_SUBMITTED' | 'CV_UPDATED' | 'AI_RESULT_READY' | 'RECRUITER_BULK_UPLOAD';

interface NotificationData {
    userName?: string;
    jobTitle?: string;
    score?: number;
    cvId?: string;
    count?: number;
}

export const sendNotification = async (to: string, type: NotificationType, data: NotificationData) => {
    let subject = '';
    let html = '';

    switch (type) {
        case 'CV_SUBMITTED':
            subject = `Application Received: ${data.jobTitle}`;
            html = `
                <div style="font-family: sans-serif; color: #333;">
                    <h2 style="color: #2563eb;">Hello ${data.userName || 'Applicant'},</h2>
                    <p>Thank you for applying for the <strong>${data.jobTitle}</strong> position on SkillSync.</p>
                    <p>We've received your CV and it's currently being processed by our AI screening system.</p>
                    <p>You'll receive another email once your analysis is ready.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #666;">This is an automated message from SkillSync.</p>
                </div>
            `;
            break;
        case 'CV_UPDATED':
            subject = `CV Updated: ${data.jobTitle}`;
            html = `
                <div style="font-family: sans-serif; color: #333;">
                    <h2 style="color: #2563eb;">CV Updated Successfully</h2>
                    <p>Hello ${data.userName || 'Applicant'},</p>
                    <p>Your CV for the position <strong>${data.jobTitle}</strong> has been updated and the previous version has been archived.</p>
                    <p>The AI will now re-screen your latest document.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #666;">SkillSync Recruitment Team</p>
                </div>
            `;
            break;
        case 'AI_RESULT_READY':
            subject = `AI Screening Results: ${data.jobTitle}`;
            html = `
                <div style="font-family: sans-serif; color: #333;">
                    <h2 style="color: #2563eb;">AI Analysis Complete!</h2>
                    <p>Hello ${data.userName || 'Applicant'},</p>
                    <p>The AI has finished analyzing your CV for <strong>${data.jobTitle}</strong>.</p>
                    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                        <p style="margin: 0; font-size: 14px; text-transform: uppercase; color: #666;">Match Score</p>
                        <h1 style="margin: 0; color: ${data.score && data.score > 70 ? '#16a34a' : '#ea580c'}; font-size: 48px;">${data.score}%</h1>
                    </div>
                    <p>Log in to your dashboard to see detailed feedback.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #666;">SkillSync - Empowering Your Career</p>
                </div>
            `;
            break;
        case 'RECRUITER_BULK_UPLOAD':
            subject = `Bulk Upload Complete: ${data.jobTitle}`;
            html = `
                <div style="font-family: sans-serif; color: #333;">
                    <h2 style="color: #2563eb;">Bulk Upload Successful</h2>
                    <p>Hello ${data.userName || 'Recruiter'},</p>
                    <p>You have successfully uploaded <strong>${data.count || 0}</strong> CVs for the <strong>${data.jobTitle}</strong> position.</p>
                    <p>The AI has been triggered to screen these candidates. You can track their progress in your dashboard.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #666;">SkillSync Recruitment Infrastructure</p>
                </div>
            `;
            break;
    }

    return sendEmail(to, subject, subject, html);
};
