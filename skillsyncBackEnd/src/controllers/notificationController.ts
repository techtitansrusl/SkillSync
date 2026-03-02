import { Request, Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/authMiddleware';

export const getNotifications = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const notifications = await prisma.notification.findMany({
            where: {
                userId,
                createdAt: {
                    gte: sevenDaysAgo
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json(notifications);
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ error: "Failed to fetch notifications" });
    }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.notification.update({
            where: { id, userId: req.user.id },
            data: { isRead: true }
        });
        res.json({ message: "Notification marked as read" });
    } catch (error) {
        console.error("Error updating notification:", error);
        res.status(500).json({ error: "Failed to update notification" });
    }
};

export const createNotification = async (userId: string, title: string, message: string) => {
    try {
        return await prisma.notification.create({
            data: {
                userId,
                title,
                message
            }
        });
    } catch (error) {
        console.error("Error creating notification:", error);
    }
};
