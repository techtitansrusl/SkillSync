import React, { useState } from 'react';
import { UserRole, User } from '../types';
import { Button, Input, Card } from '../components/UI';
import { api } from '../services/api';

interface AuthPageProps {
    onLogin: (user: User, token: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
    const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'verify'>('login');
    const [role, setRole] = useState<UserRole>(UserRole.APPLICANT);

    // Form State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleAuth = async () => {
        setError('');
        setMessage('');
        setLoading(true);
        try {
            let response;
            if (mode === 'login') {
                try {
                    response = await api.auth.login({ email, password, role });
                    if (response) {
                        onLogin(response.user, response.token);
                    }
                } catch (err: any) {
                    if (err.response?.status === 403 && err.response?.data?.email) {
                        // User exists but not verified
                        setEmail(err.response.data.email);
                        setMode('verify');
                        setMessage("Please verify your email to continue.");
                    } else {
                        throw err;
                    }
                }
            } else if (mode === 'register') {
                if (password !== confirmPassword) {
                    setError("Passwords do not match");
                    setLoading(false);
                    return;
                }
                response = await api.auth.register({ name, email, password, role });
                if (response) {
                    setMode('verify');
                    setMessage("Registration successful! Please check your email for the OTP.");
                }
            } else if (mode === 'verify') {
                response = await api.auth.verifyOtp({ email, code: otp });
                setMode('login');
                setMessage("Email verified successfully! You can now login.");
            } else if (mode === 'forgot') {
                if (!otp) {
                    // Step 1: Send OTP
                    await api.auth.forgotPassword(email);
                    setMessage("OTP sent to your email.");
                } else {
                    // Step 2: Reset Password
                    if (password !== confirmPassword) {
                        setError("Passwords do not match");
                        setLoading(false);
                        return;
                    }
                    await api.auth.resetPassword({ email, code: otp, newPassword: password });
                    setMode('login');
                    setMessage("Password reset successful! You can now login.");
                }
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || err.message || "Authentication failed";
            setError(errorMessage);
            // If it's a password error, we could clear the password fields, but usually better to let the user edit them.
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setLoading(true);
        setError('');
        setMessage('');
        try {
            await api.auth.resendOtp(email);
            setMessage("OTP resent successfully!");
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to resend OTP");
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
        } else if (mode === 'register' || mode === 'verify') {
            return (
                <div className="hidden md:flex flex-col items-center justify-center w-1/2 bg-blue-50 p-8 rounded-r-2xl">
                    <div className="relative">
                        <i className="fa-solid fa-users text-9xl text-blue-300"></i>
                        <i className="fa-solid fa-circle-plus text-6xl text-primary absolute -bottom-2 -right-2 bg-white rounded-full border-4 border-white"></i>
                    </div>
                    {mode === 'verify' && <p className="mt-8 text-blue-600 font-medium text-center">Check your inbox for the verification code</p>}
                </div>
            );
        } else {
            return (
                <div className="hidden md:flex flex-col items-center justify-center w-1/2 bg-yellow-50 p-8 rounded-r-2xl">
                    <i className="fa-solid fa-lock text-9xl text-secondary"></i>
                    <i className="fa-solid fa-rotate-left text-6xl text-gray-400 mt-4"></i>
                    <p className="mt-8 text-secondary font-medium text-center">Secure account recovery</p>
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

                        {/* UI Messages */}
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm text-center border border-red-100 animate-pulse">
                                {error}
                                {error.includes("locked") && (
                                    <button
                                        onClick={() => { setMode('forgot'); setError(''); }}
                                        className="block mx-auto mt-2 bg-red-600 text-white px-4 py-1 rounded-full font-bold hover:bg-red-700 transition shadow-sm"
                                    >
                                        Reset Password Now
                                    </button>
                                )}
                            </div>
                        )}
                        {message && (
                            <div className="bg-green-50 text-green-600 p-3 rounded mb-4 text-sm text-center border border-green-100">
                                {message}
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
                                <p className="text-sm text-gray-500 mb-6">Recover access to your account.</p>

                                <Input
                                    label="Email Address"
                                    type="email"
                                    placeholder="Enter associated email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={!!message && message.includes("OTP sent")}
                                />

                                {(!message || !message.includes("OTP sent")) ? (
                                    <Button className="w-full mb-4" variant="secondary" onClick={handleAuth} disabled={loading}>
                                        {loading ? 'Sending...' : 'Send OTP'}
                                    </Button>
                                ) : (
                                    <>
                                        <Input
                                            label="Verification Code (OTP)"
                                            placeholder="Enter 6-digit code"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                        />
                                        <Input
                                            label="New Password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <Input
                                            label="Confirm New Password"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />

                                        <Button className="w-full mb-4" variant="success" onClick={handleAuth} disabled={loading}>
                                            {loading ? 'Resetting...' : 'Update Password'}
                                        </Button>

                                        <button
                                            onClick={handleAuth}
                                            className="text-xs text-primary hover:underline block mx-auto mb-4"
                                            disabled={loading}
                                        >
                                            Resend OTP
                                        </button>
                                    </>
                                )}

                                <div className="text-center mt-6 pt-6 border-t border-gray-100">
                                    <button onClick={() => { setMode('login'); setMessage(''); setError(''); }} className="text-sm text-primary font-bold hover:underline flex items-center justify-center w-full">
                                        <i className="fa-solid fa-arrow-left mr-2"></i> Back to Login
                                    </button>
                                </div>
                            </>
                        )}

                        {/* VERIFY MODE */}
                        {mode === 'verify' && (
                            <>
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">Verify Email</h2>
                                <p className="text-sm text-gray-500 mb-6">We've sent a 6-digit code to <strong>{email}</strong>.</p>

                                <Input
                                    label="OTP Code"
                                    placeholder="Enter 6-digit code"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                />

                                <Button className="w-full mb-4" variant="secondary" onClick={handleAuth} disabled={loading}>
                                    {loading ? 'Verifying...' : 'Verify & Continue'}
                                </Button>

                                <div className="text-center mt-4">
                                    <p className="text-xs text-gray-500">
                                        Didn't receive the code?
                                        <button onClick={handleResendOtp} className="text-primary font-bold hover:underline ml-1" disabled={loading}>
                                            Resend
                                        </button>
                                    </p>
                                </div>

                                <div className="text-center mt-6 pt-6 border-t border-gray-100">
                                    <button onClick={() => { setMode('register'); setMessage(''); setError(''); }} className="text-sm text-primary font-bold hover:underline flex items-center justify-center w-full">
                                        <i className="fa-solid fa-arrow-left mr-2"></i> Back to Signup
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