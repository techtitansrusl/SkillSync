import React, { useState, useEffect } from 'react';
import { User, Job, Application } from '../types';
import { Button, Card, Badge, Modal } from '../components/UI';
import { api } from '../services/api';

export const ApplicantDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'jobs' | 'applications'>('jobs');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  // Data State
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'jobs') {
        const data = await api.jobs.getAll();
        setJobs(data);
      } else {
        const data = await api.applications.getMyApplications();
        setApplications(data);
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter(job => job.title.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleApply = (job: Job) => {
    setSelectedJob(job);
  };

  const submitApplication = async () => {
    if (!file || !selectedJob) return;
    setUploading(true);

    const formData = new FormData();
    formData.append('cv', file);
    formData.append('jobId', selectedJob.id);

    try {
      await api.applications.apply(formData);
      alert("Application Submitted Successfully!");
      setSelectedJob(null);
      setFile(null);
      // If we were on applications tab, we would refresh, but we return to jobs usually
    } catch (error) {
      alert("Failed to submit application");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Search & Navigation Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">
          {activeTab === 'jobs' ? 'Find Your Dream Job' : 'My Applications'}
        </h1>
        <div className="flex bg-gray-200 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-6 py-2 rounded-md font-medium transition ${activeTab === 'jobs' ? 'bg-white shadow text-primary' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Job Board
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`px-6 py-2 rounded-md font-medium transition ${activeTab === 'applications' ? 'bg-white shadow text-primary' : 'text-gray-600 hover:text-gray-900'}`}
          >
            My Applications
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">
          <i className="fa-solid fa-spinner fa-spin text-4xl mb-4"></i>
          <p>Loading...</p>
        </div>
      ) : activeTab === 'jobs' ? (
        <>
          <div className="mb-8 relative">
            <input
              type="text"
              placeholder="Search by Job Name or Tag..."
              className="w-full px-6 py-4 rounded-full border border-gray-300 shadow-sm focus:ring-2 focus:ring-primary outline-none pl-12"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <i className="fa-solid fa-search absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl"></i>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map(job => (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                    <i className="fa-solid fa-building text-2xl"></i>
                  </div>
                  <span className="text-xs font-semibold bg-gray-100 px-2 py-1 rounded text-gray-600">{job.type}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{job.title}</h3>
                <p className="text-gray-500 text-sm mb-4">{job.company || 'Company'} • {job.location}</p>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{job.description}</p>
                <Button onClick={() => handleApply(job)} className="w-full">Apply Now</Button>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-4">
          {applications.map((app: any) => {
            // App here is a CV object with included result
            const score = app.result?.score || 0;
            const status = app.result?.status || 'Pending';

            return (
              <Card key={app.id} className="flex flex-col md:flex-row items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                    <i className="fa-solid fa-file-contract text-xl"></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{app.job?.title || 'Job Application'}</h3>
                    <p className="text-sm text-gray-500">Applied on: {new Date(app.submittedDate).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-400">File: {app.fileName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 mt-4 md:mt-0">
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Status</p>
                    <Badge status={status} />
                  </div>
                  {score > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500 uppercase font-semibold">AI Match</p>
                      <span className={`text-lg font-bold ${score > 75 ? 'text-green-600' : 'text-yellow-600'}`}>
                        {score}%
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Apply Modal */}
      <Modal
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        title={`Apply for ${selectedJob?.title}`}
      >
        <div className="text-center py-6">
          <div className="mb-6">
            <i className="fa-solid fa-cloud-arrow-up text-6xl text-primary opacity-50"></i>
          </div>
          <p className="text-gray-600 mb-6">Upload your CV to apply for this position.</p>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50 mb-6 hover:bg-gray-100 transition cursor-pointer relative">
            <input
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              accept=".pdf"
            />
            <div className="flex flex-col items-center">
              <span className="text-gray-500 font-medium">{file ? file.name : "Drop File Here or Press to Browse"}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setSelectedJob(null)}>Cancel</Button>
            <Button
              variant="success"
              onClick={submitApplication}
              disabled={!file || uploading}
            >
              {uploading ? 'Uploading...' : 'Confirm Upload'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};