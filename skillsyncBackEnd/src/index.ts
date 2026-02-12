import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';
import jobRoutes from './routes/jobs';
import applicationRoutes from './routes/applications';
import aiRoutes from './routes/ai';
import logger from './utils/logger';

dotenv.config();
console.log('Environment variables loaded:', {
    DATABASE_URL: process.env.DATABASE_URL,
    PORT: process.env.PORT
});

const app = express();
const port = process.env.PORT || 4000;
export const prisma = new PrismaClient();

app.use(cors());
app.use(helmet());
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (req, res) => {
    res.json({ message: 'SkillSync API is running' });
});

// Routes
app.use('/auth', authRoutes);
app.use('/jobs', jobRoutes);
app.use('/applications', applicationRoutes);
app.use('/ai', aiRoutes);

app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
});

// Force process to stay alive (should be handled by listen, but adding as fallback)
setInterval(() => {
    // Keep-alive heartbeat
}, 60000);
