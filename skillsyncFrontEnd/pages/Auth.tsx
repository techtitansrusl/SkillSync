import React, { useState } from 'react';
import { UserRole, User } from '../types';
import { Button, Input, Card } from '../components/UI';
import { api } from '../services/api';

interface AuthPageProps {
    onLogin: (user: User, token: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
    const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
    const [role, setRole] = useState<UserRole>(UserRole.APPLICANT);

    // Form State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAuth = async () => {
        setError('');
        setLoading(true);
        try {
            let response;
            if (mode === 'login') {
                response = await api.auth.login({ email, password });
            } else if (mode === 'register') {
                if (password !== confirmPassword) {
                    setError("Passwords do not match");
                    setLoading(false);
                    return;
                }
                response = await api.auth.register({ name, email, password, role });
            }

            if (response) {
                onLogin(response.user, response.token);
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || err.message || "Authentication failed";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Illustrations based on screenshots
    const renderIllustration = () => {
        if (mode === 'login') {
            return (
                <div className="hidden md:flex flex-col items-center justify-center w-1/2 bg-gray-50 p-8 rounded-r-2xl">
                    <i className="fa-solid fa-magnifying-glass-chart text-9xl text-primary opacity-80 mb-6"></i>
                    <div className="flex gap-4 opacity-50">
                        <i className="fa-solid fa-user text-4xl text-gray-400"></i>
                        <i className="fa-solid fa-user-tie text-4xl text-gray-400"></i>
                    </div>
                </div>
            );
        } else if (mode === 'register') {
            return (
                <div className="hidden md:flex flex-col items-center justify-center w-1/2 bg-blue-50 p-8 rounded-r-2xl">
                    <div className="relative">
                        <i className="fa-solid fa-users text-9xl text-blue-300"></i>
                        <i className="fa-solid fa-circle-plus text-6xl text-primary absolute -bottom-2 -right-2 bg-white rounded-full border-4 border-white"></i>
                    </div>
                </div>
            );
        } else {
            return (
                <div className="hidden md:flex flex-col items-center justify-center w-1/2 bg-yellow-50 p-8 rounded-r-2xl">
                    <i className="fa-solid fa-lock text-9xl text-secondary"></i>
                    <i className="fa-solid fa-rotate-left text-6xl text-gray-400 mt-4"></i>
                </div>
            );
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-primary">
            <div className="w-full bg-primary py-6 text-center shadow-lg">
                <h1 className="text-3xl font-bold text-white tracking-widest uppercase">Welcome to SkillSync</h1>
                <p className="text-white text-xs opacity-80 mt-1">AI-Powered Resume Screening System</p>
            </div>

            <div className="flex-grow flex items-center justify-center w-full px-4">
                <Card className="w-full max-w-4xl p-0 flex shadow-2xl overflow-hidden rounded-2xl min-h-[500px]">
                    {/* Form Section */}
                    <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm text-center">
                                {error}
                            </div>
                        )}

                        {/* LOGIN MODE */}
                        {mode === 'login' && (
                            <>
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">Login</h2>
                                <p className="text-sm text-gray-500 mb-6">If you already have an account, fill in the credentials below.</p>

                                {/* Role Toggle for Login */}
                                <div className="flex justify-center mb-6 bg-gray-100 rounded-full p-1 w-fit mx-auto">
                                    <button
                                        onClick={() => setRole(UserRole.APPLICANT)}
                                        className={`px-4 py-1 rounded-full text-sm font-medium transition ${role === UserRole.APPLICANT ? 'bg-primary text-white shadow' : 'text-gray-500'}`}
                                    >
                                        Applicant
                                    </button>
                                    <button
                                        onClick={() => setRole(UserRole.RECRUITER)}
                                        className={`px-4 py-1 rounded-full text-sm font-medium transition ${role === UserRole.RECRUITER ? 'bg-primary text-white shadow' : 'text-gray-500'}`}
                                    >
                                        Recruiter
                                    </button>
                                </div>

                                <Input
                                    label="Email"
                                    type="email"
                                    placeholder="Enter email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <Input
                                    label="Password"
                                    type="password"
                                    placeholder="Enter password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />

                                <Button className="w-full mb-4" variant="secondary" onClick={handleAuth} disabled={loading}>
                                    {loading ? 'Logging in...' : 'Login'}
                                </Button>

                                <div className="text-center">
                                    <button onClick={() => setMode('forgot')} className="text-xs text-gray-500 hover:text-primary mb-2 block">Forgot Password?</button>
                                    <p className="text-xs text-gray-500">Don't have an account? <button onClick={() => setMode('register')} className="text-primary font-bold hover:underline">Register</button></p>
                                </div>
                            </>
                        )}

                        {/* REGISTER MODE */}
                        {mode === 'register' && (
                            <>
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">Sign Up</h2>
                                <p className="text-sm text-gray-500 mb-6">Create your account to get started.</p>

                                {/* Role Toggle for Register */}
                                <div className="flex justify-center mb-6 bg-gray-100 rounded-full p-1 w-fit mx-auto">
                                    <button
                                        onClick={() => setRole(UserRole.APPLICANT)}
                                        className={`px-4 py-1 rounded-full text-sm font-medium transition ${role === UserRole.APPLICANT ? 'bg-primary text-white shadow' : 'text-gray-500'}`}
                                    >
                                        Applicant
                                    </button>
                                    <button
                                        onClick={() => setRole(UserRole.RECRUITER)}
                                        className={`px-4 py-1 rounded-full text-sm font-medium transition ${role === UserRole.RECRUITER ? 'bg-primary text-white shadow' : 'text-gray-500'}`}
                                    >
                                        Recruiter
                                    </button>
                                </div>

                                <Input label="Full Name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} />
                                <Input label="Email Address" type="email" placeholder="john@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                                <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                                <Input label="Re-enter Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />

                                <Button className="w-full mb-4" variant="secondary" onClick={handleAuth} disabled={loading}>
                                    {loading ? 'Registering...' : 'Register'}
                                </Button>

                                <div className="text-center mt-6 pt-6 border-t border-gray-100">
                                    <p className="text-sm text-gray-500">Already have an account? <button onClick={() => setMode('login')} className="text-primary font-bold hover:underline">Login</button></p>
                                </div>
                            </>
                        )}

                        {/* FORGOT PASSWORD MODE */}
                        {mode === 'forgot' && (
                            <>
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">Reset Password</h2>
                                <p className="text-sm text-gray-500 mb-6">Enter your email to receive an OTP.</p>

                                <Input label="Email Address" type="email" placeholder="Enter associated email" />

                                <Button className="w-full mb-4" variant="success">Send OTP</Button>

                                <Input label="OTP" placeholder="Enter OTP" className="mt-4" />
                                <Input label="New Password" type="password" />
                                <Input label="Confirm Password" type="password" />

                                <Button className="w-full mb-4" variant="success" onClick={() => setMode('login')}>Reset Password</Button>

                                <div className="text-center mt-6 pt-6 border-t border-gray-100">
                                    <button onClick={() => setMode('login')} className="text-sm text-primary font-bold hover:underline flex items-center justify-center w-full">
                                        <i className="fa-solid fa-arrow-left mr-2"></i> Back to Login
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Illustration Section */}
                    {renderIllustration()}
                </Card>
            </div>
        </div>
    );
};