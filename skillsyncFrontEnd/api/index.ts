import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:4000', // Backend URL
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('skillSyncToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;

export const authAPI = {
    login: (credentials: any) => api.post('/auth/login', credentials),
    register: (data: any) => api.post('/auth/register', data),
};

export const jobsAPI = {
    getAll: () => api.get('/jobs'),
    getById: (id: string) => api.get(`/jobs/${id}`),
    create: (data: any) => api.post('/jobs', data),
};

export const applicationsAPI = {
    apply: (formData: FormData) => api.post('/applications', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    getMyApplications: () => api.get('/applications/my'),
    getJobApplications: (jobId: string) => api.get(`/applications/job/${jobId}`),
};

export const aiAPI = {
    processCandidates: (jobId: string) => api.post('/ai/process-candidates', { jobId }),
};
