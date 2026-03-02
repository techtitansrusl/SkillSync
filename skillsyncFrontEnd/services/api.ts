import axios from 'axios';
import { User, Job, Application } from '../types';

const API_URL = 'http://localhost:4000';

const axiosInstance = axios.create({
    baseURL: API_URL
});

axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('skillSyncToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const api = {
    auth: {
        register: async (data: any) => {
            const res = await axiosInstance.post('/auth/register', data);
            return res.data;
        },
        login: async (credentials: any) => {
            const res = await axiosInstance.post('/auth/login', credentials);
            return res.data;
        },
        verifyOtp: async (data: { email: string; code: string }) => {
            const res = await axiosInstance.post('/auth/verify-otp', data);
            return res.data;
        },
        resendOtp: async (email: string) => {
            const res = await axiosInstance.post('/auth/resend-otp', { email });
            return res.data;
        },
        forgotPassword: async (email: string) => {
            const res = await axiosInstance.post('/auth/forgot-password', { email });
            return res.data;
        },
        resetPassword: async (data: any) => {
            const res = await axiosInstance.post('/auth/reset-password', data);
            return res.data;
        },
        changePassword: async (data: any) => {
            const res = await axiosInstance.post('/auth/change-password', data);
            return res.data;
        }
    },
    jobs: {
        getAll: async (params?: any) => {
            const res = await axiosInstance.get('/jobs', { params });
            // Normalize backend data (recruiter.companyName) to frontend Job interface (company)
            return res.data.map((job: any) => ({
                ...job,
                company: (job.recruiter?.companyName && job.recruiter.companyName !== 'Unspecified') ? job.recruiter.companyName : ''
            }));
        },
        getById: async (id: string) => {
            const res = await axiosInstance.get(`/jobs/${id}`);
            return res.data;
        },
        create: async (data: any) => {
            const res = await axiosInstance.post('/jobs', data);
            return res.data;
        },
        delete: async (id: string) => {
            const res = await axiosInstance.delete(`/jobs/${id}`);
            return res.data;
        }
    },
    applications: {
        // Updated to handle FormData for file upload
        apply: async (formData: FormData) => {
            const res = await axiosInstance.post('/applications', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return res.data;
        },
        getMyApplications: async () => {
            const res = await axiosInstance.get('/applications/my');
            return res.data;
        },
        getByJobId: async (jobId: string) => {
            const res = await axiosInstance.get(`/applications/job/${jobId}`);
            return res.data;
        },
        bulkApply: async (formData: FormData) => {
            const res = await axiosInstance.post('/applications/bulk', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return res.data;
        },
        updateCv: async (id: string, formData: FormData) => {
            const res = await axiosInstance.put(`/applications/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return res.data;
        },
        withdraw: async (id: string) => {
            const res = await axiosInstance.post(`/applications/${id}/withdraw`);
            return res.data;
        }
    },
    ai: {
        generateJobDescription: async (title: string) => {
            const res = await axiosInstance.post('/ai/job-description', { title });
            return res.data;
        },
        analyzeResume: async (resumeText: string, jobDescription: string) => {
            // Legacy endpoint
            const res = await axiosInstance.post('/ai/analyze-resume', { resumeText, jobDescription });
            return res.data;
        },
        processCandidates: async (jobId: string) => {
            const res = await axiosInstance.post('/ai/process-candidates', { jobId });
            return res.data;
        }
    },
    applicants: {
        getProfile: async () => {
            const res = await axiosInstance.get('/applicants/profile');
            return res.data;
        },
        updateProfile: async (data: any) => {
            const res = await axiosInstance.put('/applicants/profile', data);
            return res.data;
        },
        getById: async (id: string) => {
            const res = await axiosInstance.get(`/applicants/${id}`);
            return res.data;
        }
    },
    notifications: {
        getAll: async () => {
            const res = await axiosInstance.get('/notifications');
            return res.data;
        },
        markAsRead: async (id: string) => {
            const res = await axiosInstance.patch(`/notifications/${id}/read`);
            return res.data;
        }
    }
};
