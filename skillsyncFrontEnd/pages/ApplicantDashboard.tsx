import React, { useState, useEffect } from 'react';
import { User, Job, Application } from '../types';
import { Button, Card, Badge, Modal, Input } from '../components/UI';
import { api } from '../services/api';

export const ApplicantDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'jobs' | 'applications' | 'profile'>('jobs');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedCvForUpdate, setSelectedCvForUpdate] = useState<any>(null);
  const [updateFile, setUpdateFile] = useState<File | null>(null);
  const [updating, setUpdating] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [selectedJobForDetails, setSelectedJobForDetails] = useState<Job | null>(null);

  // Data State
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile State
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    contact: '',
    education: '',
    experience: '',
    skills: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'profile') {
        const profileData = await api.applicants.getProfile();
        setProfile(profileData);
      } else {
        const cvData = await api.applications.getMyApplications();
        setApplications(cvData);

        const jobData = await api.jobs.getAll();
        setJobs(jobData);
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.name || !profile.contact) {
      return alert("Name and Contact are mandatory details!");
    }
    setSavingProfile(true);
    try {
      await api.applicants.updateProfile(profile);
      alert("Profile Updated Successfully!");
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to update profile");
    } finally {
      setSavingProfile(false);
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
      fetchData(); // Refresh to update status
    } catch (error: any) {
      const message = error.response?.data?.error || "Failed to submit application";
      alert(message);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateCv = async () => {
    if (!updateFile || !selectedCvForUpdate) return;
    setUpdating(true);
    const formData = new FormData();
    formData.append('cv', updateFile);
    try {
      await api.applications.updateCv(selectedCvForUpdate.id, formData);
      alert("CV Updated and Archived Successfully!");
      setSelectedCvForUpdate(null);
      setUpdateFile(null);
      fetchData(); // Refresh to update status and file names
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to update CV");
    } finally {
      setUpdating(false);
    }
  };

  const handleWithdraw = async (applicationId: string) => {
    if (!window.confirm("Are you sure you want to withdraw this application? This action cannot be undone.")) return;

    try {
      await api.applications.withdraw(applicationId);
      alert("Application withdrawn successfully");
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to withdraw application");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Search & Navigation Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">
          {activeTab === 'jobs' ? 'Find Your Dream Job' : activeTab === 'applications' ? 'My Applications' : 'My Profile'}
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
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-2 rounded-md font-medium transition ${activeTab === 'profile' ? 'bg-white shadow text-primary' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Profile
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
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-gray-500 text-sm mb-4">
                  {job.company && (
                    <span className="flex items-center gap-1"><i className="fa-solid fa-building text-gray-400"></i> {job.company}</span>
                  )}
                  <span className="flex items-center gap-1"><i className="fa-solid fa-location-dot text-gray-400"></i> {job.location}</span>
                  {(job as any).salary && (
                    <span className="flex items-center gap-1 text-green-600 font-semibold"><i className="fa-solid fa-money-bill-wave"></i> ${Number((job as any).salary).toLocaleString()}/mo</span>
                  )}
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{job.description}</p>
                <div className="flex items-center gap-2 mb-4 text-xs font-semibold text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
                  <i className="fa-solid fa-clock"></i>
                  <span>Expires: {new Date(job.expiresAt).toLocaleString()}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setSelectedJobForDetails(job)}
                  >
                    View Details
                  </Button>
                  {applications.some(app => app.jobId === job.id) ? (
                    <Button variant="secondary" className="flex-1" disabled>Applied</Button>
                  ) : (
                    <Button onClick={() => handleApply(job)} className="flex-1">Apply</Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : activeTab === 'applications' ? (
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
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => window.open(`http://localhost:4000${app.fileUrl}`, '_blank')}
                        className="flex items-center gap-2 text-xs"
                      >
                        <i className="fa-solid fa-file-pdf"></i>
                        View CV
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedCvForUpdate(app)}
                        className="flex items-center gap-2 text-xs"
                      >
                        <i className="fa-solid fa-rotate"></i>
                        Update CV
                      </Button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Status</p>
                    <Badge status={status} />
                  </div>
                  {status.toLowerCase() !== 'shortlisted' && status.toLowerCase() !== 'withdrawn' && status.toLowerCase() !== 'rejected' && !app.result && (
                    <div className="text-right ml-4">
                      <Button
                        variant="outline"
                        onClick={() => handleWithdraw(app.id)}
                        className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 px-4 py-1 text-xs"
                      >
                        <i className="fa-solid fa-ban mr-1"></i>
                        Withdraw
                      </Button>
                    </div>
                  )}
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
      ) : (
        <Card className="max-w-3xl mx-auto p-8">
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Full Name *"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
              <Input
                label="Email (ReadOnly)"
                value={profile.email}
                disabled
              />
              <Input
                label="Contact Number *"
                value={profile.contact}
                onChange={(e) => setProfile({ ...profile, contact: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Education</label>
              <textarea
                className="w-full h-32 px-4 py-2 bg-gray-100 border border-transparent rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none"
                value={profile.education}
                onChange={(e) => setProfile({ ...profile, education: e.target.value })}
                placeholder="List your degree, university, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Experience</label>
              <textarea
                className="w-full h-32 px-4 py-2 bg-gray-100 border border-transparent rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none"
                value={profile.experience}
                onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
                placeholder="List your work history..."
              />
            </div>

            <Input
              label="Skills"
              value={profile.skills}
              onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
              placeholder="e.g. React, Node.js, Python (comma separated)"
            />

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={savingProfile}>
                {savingProfile ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          </form>
        </Card>
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

      {/* Update CV Modal */}
      <Modal
        isOpen={!!selectedCvForUpdate}
        onClose={() => setSelectedCvForUpdate(null)}
        title="Update Applied CV"
      >
        <div className="text-center py-6">
          <div className="mb-4">
            <i className="fa-solid fa-file-arrow-up text-5xl text-primary opacity-50"></i>
          </div>
          <p className="text-sm text-gray-600 mb-6 italic">
            Note: Your old CV version will be archived automatically.
          </p>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50 mb-6 hover:bg-gray-100 transition cursor-pointer relative">
            <input
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={(e) => setUpdateFile(e.target.files?.[0] || null)}
              accept=".pdf"
            />
            <div className="flex flex-col items-center">
              <span className="text-gray-500 font-medium font-outfit">
                {updateFile ? updateFile.name : "Select New CV Version"}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setSelectedCvForUpdate(null)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleUpdateCv}
              disabled={!updateFile || updating}
            >
              {updating ? 'Updating...' : 'Confirm Update'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Details Modal */}
      <Modal
        isOpen={!!selectedJobForDetails}
        onClose={() => setSelectedJobForDetails(null)}
        title="Job Details"
      >
        {selectedJobForDetails && (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedJobForDetails.title}</h2>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-gray-500 text-sm mt-1">
                  {selectedJobForDetails.company && (
                    <span className="flex items-center gap-1"><i className="fa-solid fa-building text-gray-400"></i> {selectedJobForDetails.company}</span>
                  )}
                  <span className="flex items-center gap-1"><i className="fa-solid fa-location-dot text-gray-400"></i> {selectedJobForDetails.location}</span>
                  {(selectedJobForDetails as any).salary && (
                    <span className="flex items-center gap-1 text-green-600 font-semibold"><i className="fa-solid fa-money-bill-wave"></i> ${Number((selectedJobForDetails as any).salary).toLocaleString()}/mo</span>
                  )}
                </div>
              </div>
              <Badge status={selectedJobForDetails.status} />
            </div>

            <div className="flex flex-wrap gap-3">
              <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                <i className="fa-solid fa-briefcase mr-1"></i> {selectedJobForDetails.type}
              </span>
              <span className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                <i className="fa-solid fa-clock mr-1"></i> Expires: {new Date(selectedJobForDetails.expiresAt).toLocaleDateString()}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-2 border-b pb-1">Description</h3>
              <div className="text-gray-600 leading-relaxed whitespace-pre-wrap text-sm">
                {selectedJobForDetails.description}
              </div>
            </div>

            {(selectedJobForDetails as any).qualifications?.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-2 border-b pb-1">Qualifications</h3>
                <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                  {(selectedJobForDetails as any).qualifications.map((q: any, i: number) => (
                    <li key={i}>{q.qualification}</li>
                  ))}
                </ul>
              </div>
            )}

            {(selectedJobForDetails as any).skills?.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-2 border-b pb-1">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {(selectedJobForDetails as any).skills.map((s: any, i: number) => (
                    <span key={i} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-md text-xs font-medium">
                      {s.skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t">
              <Button variant="secondary" onClick={() => setSelectedJobForDetails(null)} className="mr-2">Close</Button>
              {!applications.some(app => app.jobId === selectedJobForDetails.id) && (
                <Button variant="primary" onClick={() => {
                  setSelectedJobForDetails(null);
                  handleApply(selectedJobForDetails);
                }}>
                  Apply Now
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};