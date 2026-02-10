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
        login: async (data: any) => {
            const res = await axiosInstance.post('/auth/login', data);
            return res.data;
        }
    },
    jobs: {
        getAll: async (params?: any) => {
            const res = await axiosInstance.get('/jobs', { params });
            // Normalize backend data (recruiter.companyName) to frontend Job interface (company)
            return res.data.map((job: any) => ({
                ...job,
                company: job.recruiter?.companyName || 'Unknown Company'
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
    }
};
