import React, { useState, useEffect } from 'react';
import { User, Job, Application } from '../types';
import { Button, Card, Badge, Input, Modal } from '../components/UI';
import { api } from '../services/api';

export const RecruiterDashboard: React.FC<{ user: User }> = ({ user }) => {
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

    // Data State
    const [jobs, setJobs] = useState<Job[]>([]);
    const [candidates, setCandidates] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Create Job State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newJobTitle, setNewJobTitle] = useState('');
    const [generatedDesc, setGeneratedDesc] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Bulk Upload State
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadJobId, setUploadJobId] = useState<string | null>(null);
    const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // AI Screening State
    const [analyzing, setAnalyzing] = useState(false);

    useEffect(() => {
        fetchJobs();
    }, []);

    useEffect(() => {
        if (selectedJobId) {
            fetchCandidates(selectedJobId);
        }
    }, [selectedJobId]);

    const fetchJobs = async () => {
        try {
            setLoading(true);
            const data = await api.jobs.getAll({ recruiterId: user.id });
            setJobs(data);
        } catch (error) {
            console.error("Failed to fetch jobs", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCandidates = async (jobId: string) => {
        try {
            const data = await api.applications.getByJobId(jobId);
            setCandidates(data);
        } catch (error) {
            console.error("Failed to fetch candidates", error);
        }
    };

    // Generate JD Logic
    const handleGenerateJD = async () => {
        if (!newJobTitle) return alert("Please enter a job title first");
        setIsGenerating(true);
        try {
            const result = await api.ai.generateJobDescription(newJobTitle);
            setGeneratedDesc(result.description);
        } catch (error) {
            alert("Failed to generate description");
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePostJob = async () => {
        try {
            await api.jobs.create({
                title: newJobTitle,
                company: "My Company",
                location: "Remote",
                type: "Full-time",
                description: generatedDesc,
                // requirements extracted or just passed as is
                qualifications: [],
                skills: []
            });
            setShowCreateModal(false);
            fetchJobs();
            alert("Job Posted Successfully!");
        } catch (error) {
            alert("Failed to post job");
        }
    };

    // Run AI Screening Logic (Process ALL candidates)
    const handleRunScreening = async () => {
        if (!selectedJobId) return;
        setAnalyzing(true);

        try {
            const response = await api.ai.processCandidates(selectedJobId);
            // Refresh candidates to see new scores
            await fetchCandidates(selectedJobId);
            alert(`Screening complete! Processed ${response.results?.length || 0} candidates.`);
        } catch (error) {
            console.error("Screening failed", error);
            alert("Screening failed. Ensure AI service is running.");
        } finally {
            setAnalyzing(false);
        }
    };

    // Open Upload Modal
    const handleOpenUpload = (jobId: string) => {
        setUploadJobId(jobId);
        setUploadFiles(null);
        setShowUploadModal(true);
    };

    // Handle Bulk Upload
    const handleUploadSubmit = async () => {
        if (!uploadFiles || !uploadJobId) return;
        setIsUploading(true);

        try {
            // Upload files one by one (Promise.all could be used but we want to avoid timeout on large batches)
            const promises = Array.from(uploadFiles).map(file => {
                const formData = new FormData();
                formData.append('cv', file);
                formData.append('jobId', uploadJobId);
                return api.applications.apply(formData);
            });

            await Promise.all(promises);

            alert(`Successfully uploaded ${uploadFiles.length} CVs.`);
            setShowUploadModal(false);
            setUploadJobId(null);
            setUploadFiles(null);

            // Refresh candidates if we are viewing this job
            if (selectedJobId === uploadJobId) {
                fetchCandidates(selectedJobId);
            }
        } catch (error) {
            console.error("Upload failed", error);
            alert("Failed to upload some files.");
        } finally {
            setIsUploading(false);
        }
    };

    const getJobTitleForUpload = () => {
        return jobs.find(j => j.id === uploadJobId)?.title || 'Job';
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Recruiter Dashboard</h1>
                <Button onClick={() => setShowCreateModal(true)} variant="primary">
                    <i className="fa-solid fa-plus mr-2"></i> Post New Job
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="flex items-center gap-4 border-l-4 border-primary">
                    <div className="text-3xl font-bold text-primary">{jobs.length}</div>
                    <div className="text-gray-500">Active Jobs</div>
                </Card>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="flex border-b border-gray-200">
                    <button
                        className={`flex-1 py-4 text-center font-medium ${!selectedJobId ? 'bg-gray-50 text-primary border-b-2 border-primary' : 'text-gray-600 hover:bg-gray-50'}`}
                        onClick={() => setSelectedJobId(null)}
                    >
                        Job Management
                    </button>
                    <button
                        className={`flex-1 py-4 text-center font-medium ${selectedJobId ? 'bg-gray-50 text-primary border-b-2 border-primary' : 'text-gray-600 hover:bg-gray-50'}`}
                        disabled={!selectedJobId}
                    >
                        Candidates
                    </button>
                </div>

                <div className="p-6">
                    {!selectedJobId ? (
                        loading ? <div className="text-center p-8">Loading jobs...</div> : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Title</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicants</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posted Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {jobs.map(job => (
                                            <tr key={job.id} className="hover:bg-gray-50 transition">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{job.title}</div>
                                                    <div className="text-sm text-gray-500">{job.location}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Badge status={job.status} />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">
                                                            {job.applicantsCount || 0}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(job.postedDate).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="secondary"
                                                            className="text-xs px-3 py-1 flex items-center"
                                                            onClick={() => handleOpenUpload(job.id)}
                                                            title="Upload CVs"
                                                        >
                                                            <i className="fa-solid fa-cloud-arrow-up mr-1"></i> Upload
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            className="text-xs px-3 py-1"
                                                            onClick={() => setSelectedJobId(job.id)}
                                                        >
                                                            View Candidates
                                                        </Button>
                                                        <Button
                                                            variant="danger"
                                                            className="text-xs px-3 py-1"
                                                            onClick={async () => {
                                                                if (window.confirm('Are you sure you want to delete this job? All applications will also be removed.')) {
                                                                    try {
                                                                        await api.jobs.delete(job.id);
                                                                        fetchJobs();
                                                                    } catch (error) {
                                                                        alert("Failed to delete job");
                                                                    }
                                                                }
                                                            }}
                                                            title="Delete Job"
                                                        >
                                                            <i className="fa-solid fa-trash"></i>
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    ) : (
                        <div>
                            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setSelectedJobId(null)}
                                        className="text-gray-400 hover:text-primary transition-colors p-2 -ml-2 rounded-full hover:bg-gray-100"
                                        title="Back to Job Management"
                                    >
                                        <i className="fa-solid fa-arrow-left text-xl"></i>
                                    </button>
                                    <h2 className="text-xl font-bold text-gray-800">
                                        Candidates for {jobs.find(j => j.id === selectedJobId)?.title}
                                    </h2>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="primary"
                                        onClick={handleRunScreening}
                                        disabled={analyzing}
                                    >
                                        {analyzing ? <i className="fa-solid fa-spinner fa-spin mr-2"></i> : <i className="fa-solid fa-robot mr-2"></i>}
                                        Run AI Screening
                                    </Button>
                                    <Button variant="secondary" onClick={() => setSelectedJobId(null)}>Back to Jobs</Button>
                                </div>
                            </div>

                            <div className="grid gap-4">
                                {candidates.length === 0 ? (
                                    <div className="text-center py-12 text-gray-400">
                                        <i className="fa-solid fa-folder-open text-4xl mb-4"></i>
                                        <p>No candidates found for this job.</p>
                                        <Button
                                            variant="primary"
                                            className="mt-4"
                                            onClick={() => handleOpenUpload(selectedJobId)}
                                        >
                                            Upload CVs
                                        </Button>
                                    </div>
                                ) : (
                                    candidates.map((candidate: any) => {
                                        const name = candidate.applicant?.user?.name || "Unknown Applicant";
                                        const score = candidate.result?.score || 0;
                                        const comment = candidate.result?.comment;

                                        return (
                                            <div key={candidate.id} className="border rounded-lg p-4 flex flex-col md:flex-row items-center justify-between hover:shadow-md transition">
                                                <div className="flex items-center gap-4 mb-4 md:mb-0">
                                                    <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl">
                                                        {name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-lg">{name}</h3>
                                                        <div className="text-xs text-gray-500 truncate max-w-[200px]">{candidate.fileName}</div>
                                                    </div>
                                                </div>

                                                <div className="flex-1 md:px-8">
                                                    {comment ? (
                                                        <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800 border border-blue-100">
                                                            <i className="fa-solid fa-robot mr-2"></i>
                                                            <strong>AI Insight:</strong> {comment}
                                                        </div>
                                                    ) : (
                                                        <div className="text-center text-gray-400 text-sm italic">
                                                            Run AI Screening to generate insights
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex flex-col items-end gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-gray-500">Match Score:</span>
                                                        <span className={`text-xl font-bold ${score >= 80 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-gray-400'}`}>
                                                            {score}%
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button variant="outline" className="text-xs px-3 py-1" onClick={() => window.open(`http://localhost:4000${candidate.fileUrl}`, '_blank')}>
                                                            View CV
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Job Modal */}
            <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Post New Job">
                <div className="space-y-4">
                    <Input
                        label="Job Title"
                        placeholder="e.g. Senior Software Engineer"
                        value={newJobTitle}
                        onChange={(e) => setNewJobTitle(e.target.value)}
                    />
                    <div className="flex justify-between items-center">
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <button
                            onClick={handleGenerateJD}
                            className="text-xs text-primary hover:text-primary-dark font-semibold flex items-center"
                            disabled={isGenerating}
                        >
                            {isGenerating ? <i className="fa-solid fa-spinner fa-spin mr-1"></i> : <i className="fa-solid fa-wand-magic-sparkles mr-1"></i>}
                            Generate with AI
                        </button>
                    </div>
                    <textarea
                        className="w-full h-32 px-4 py-2 bg-gray-100 border border-transparent rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none"
                        placeholder="Enter job description or generate it using AI..."
                        value={generatedDesc}
                        onChange={(e) => setGeneratedDesc(e.target.value)}
                    ></textarea>

                    <Button className="w-full mt-4" onClick={handlePostJob}>Post Job</Button>
                </div>
            </Modal>

            {/* Bulk Upload Modal */}
            <Modal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} title={`Upload CVs for ${getJobTitleForUpload()}`}>
                <div className="text-center py-4">
                    <div className="mb-4">
                        <i className="fa-solid fa-copy text-5xl text-primary opacity-50"></i>
                    </div>
                    <p className="text-sm text-gray-600 mb-6">
                        Select multiple PDF files to upload.
                    </p>

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 mb-6 relative">
                        <input
                            type="file"
                            multiple
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={(e) => setUploadFiles(e.target.files)}
                            accept=".pdf"
                        />
                        <div className="flex flex-col items-center">
                            <span className="text-primary font-medium">
                                {uploadFiles && uploadFiles.length > 0
                                    ? `${uploadFiles.length} files selected`
                                    : "Click to select or drag files here"}
                            </span>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button variant="secondary" onClick={() => setShowUploadModal(false)}>Cancel</Button>
                        <Button
                            variant="success"
                            onClick={handleUploadSubmit}
                            disabled={!uploadFiles || uploadFiles.length === 0 || isUploading}
                        >
                            {isUploading ? 'Uploading...' : 'Confirm Upload'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};