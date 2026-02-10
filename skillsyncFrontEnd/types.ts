export enum UserRole {
  APPLICANT = 'APPLICANT',
  RECRUITER = 'RECRUITER',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  requirements: string[];
  postedDate: string;
  status: 'Active' | 'Closed' | 'Draft';
  applicantsCount: number;
}

export interface Application {
  id: string;
  jobId: string;
  applicantId: string;
  applicantName: string;
  status: 'Pending' | 'Screening' | 'Shortlisted' | 'Rejected' | 'Withdrawn';
  matchScore: number;
  aiInsights: string;
  appliedDate: string;
  resumeUrl: string;
  skillsFound: string[];
}

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
}