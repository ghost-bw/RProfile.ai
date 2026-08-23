import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { Award, Mail, Lock, User as UserIcon, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isForgetPassword, setIsForgetPassword] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        newPassword: '',
        otp: ''
    });
    const [error, setError] = useState('');
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (showPassword) {
            const timer = setTimeout(() => setShowPassword(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [showPassword]);

    useEffect(() => {
        if (showNewPassword) {
            const timer = setTimeout(() => setShowNewPassword(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [showNewPassword]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            password: '',
            newPassword: '',
            otp: ''
        });
        setError('');
        setMsg('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMsg('');
        setLoading(true);

        try {
            if (isVerifying) {
                const res = await api.post('/auth/verify-otp', {
                    email: formData.email,
                    otp: formData.otp
                });
                localStorage.setItem('token', res.data.token);
                navigate('/dashboard');
                return;
            }

            if (isForgetPassword) {
                if (isResetting) {
                    const res = await api.post('/auth/reset-password', {
                        email: formData.email,
                        otp: formData.otp,
                        newPassword: formData.newPassword
                    });
                    const successMsg = res.data.msg;
                    resetForm();
                    setIsForgetPassword(false);
                    setIsResetting(false);
                    setMsg(successMsg);
                } else {
                    const res = await api.post('/auth/forgot-password', {
                        email: formData.email
                    });
                    setMsg(res.data.msg);
                    setIsResetting(true);
                }
                return;
            }

            const url = isLogin ? '/auth/login' : '/auth/signup';
            const res = await api.post(url, formData);
            
            if (!isLogin) {
                setIsVerifying(true);
                setMsg('OTP sent to your email. Please verify.');
            } else {
                localStorage.setItem('token', res.data.token);
                navigate('/dashboard');
            }
        } catch (err) {
            console.error('API ERROR:', err);
            let detailedError = 'Something went wrong. Please try again.';
            if (err.response) {
                detailedError = err.response.data?.msg || err.response.data?.error || `Server Error: ${err.response.status}`;
            }
            setError(detailedError);
        } finally {
            setLoading(false);
        }
    };

    const googleSuccess = async (response) => {
        setLoading(true);
        try {
            const res = await api.post('/auth/google', {
                tokenId: response.credential
            });
            localStorage.setItem('token', res.data.token);
            navigate('/dashboard');
        } catch (err) {
            console.error('Google Auth Error:', err);
            setError(err.response?.data?.msg || err.response?.data?.error || 'Google Login failed');
        } finally {
            setLoading(false);
        }
    };

    const googleError = () => {
        setError('Google Login was unsuccessful. Try again later');
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-blue-100 w-full max-w-md border border-gray-100">
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-[#1E3A8A] p-4 rounded-3xl shadow-lg shadow-blue-200 mb-4">
                        <Award className="text-white w-10 h-10" />
                    </div>
                    <h1 className="text-3xl font-black text-[#1E3A8A] tracking-tight">RProfile<span className="text-blue-500">.ai</span></h1>
                    <p className="text-gray-400 font-medium mt-2 text-center">
                        {isVerifying ? 'Enter the code sent to your email' : 
                         isForgetPassword ? (isResetting ? 'Create your new password' : 'Enter email to reset password') :
                         (isLogin ? 'Welcome back to your career copilot' : 'Start your journey to an elite career')}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold mb-6 border border-red-100 text-center">
                        {error}
                    </div>
                )}
                {msg && (
                    <div className="bg-green-50 text-green-600 p-4 rounded-2xl text-sm font-bold mb-6 border border-green-100 text-center flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 mr-2" /> {msg}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {isVerifying ? (
                        <div className="relative">
                            <CheckCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none z-10" />
                            <input
                                type="text"
                                name="otp"
                                placeholder="Enter 6-digit OTP"
                                value={formData.otp}
                                onChange={handleChange}
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:bg-white transition font-medium text-gray-900"
                                required
                            />
                        </div>
                    ) : isForgetPassword ? (
                        <>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none z-10" />
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Email Address"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:bg-white transition font-medium text-gray-900"
                                    required
                                    disabled={isResetting}
                                />
                            </div>
                            {isResetting && (
                                <>
                                    <div className="relative">
                                        <CheckCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none z-10" />
                                        <input
                                            type="text"
                                            name="otp"
                                            placeholder="Enter 6-digit OTP"
                                            value={formData.otp}
                                            onChange={handleChange}
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:bg-white transition font-medium text-gray-900"
                                            required
                                        />
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none z-10" />
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            name="newPassword"
                                            placeholder="New Password"
                                            value={formData.newPassword}
                                            onChange={handleChange}
                                            className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:bg-white transition font-medium text-gray-900"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition z-10"
                                        >
                                            {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <>
                            {!isLogin && (
                                <div className="relative">
                                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none z-10" />
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="Full Name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:bg-white transition font-medium text-gray-900"
                                        required
                                    />
                                </div>
                            )}
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none z-10" />
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Email Address"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:bg-white transition font-medium text-gray-900"
                                    required
                                />
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none z-10" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="Password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:bg-white transition font-medium text-gray-900"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition z-10"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {isLogin && (
                                <div className="text-right">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            resetForm();
                                            setIsForgetPassword(true);
                                        }}
                                        className="text-sm font-bold text-blue-500 hover:text-blue-600 transition"
                                    >
                                        Forgot Password?
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-[#1E3A8A] hover:bg-[#152A63] text-white rounded-2xl font-black text-lg transition shadow-xl shadow-blue-100 mt-4 disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : 
                         isVerifying ? 'Verify Email' : 
                         isForgetPassword ? (isResetting ? 'Reset Password' : 'Send OTP') :
                         (isLogin ? 'Sign In' : 'Create Account')}
                    </button>
                </form>

                {!isVerifying && !isForgetPassword && (
                    <>
                        <div className="my-6 flex items-center justify-between">
                            <span className="border-b border-gray-200 w-full"></span>
                            <span className="text-xs text-gray-400 px-4 font-bold uppercase tracking-widest">OR</span>
                            <span className="border-b border-gray-200 w-full"></span>
                        </div>

                        <div className="flex justify-center">
                            <GoogleLogin
                                onSuccess={googleSuccess}
                                onError={googleError}
                                theme="outline"
                                shape="pill"
                                text={isLogin ? "signin_with" : "signup_with"}
                            />
                        </div>
                    </>
                )}

                <div className="mt-8 text-center">
                    <button
                        onClick={() => {
                            resetForm();
                            if (isVerifying) {
                                setIsVerifying(false);
                            } else if (isForgetPassword) {
                                setIsForgetPassword(false);
                                setIsResetting(false);
                            } else {
                                setIsLogin(!isLogin);
                            }
                        }}
                        className="text-sm font-bold text-gray-400 hover:text-[#1E3A8A] transition"
                    >
                        {isVerifying ? "Back to signup" : 
                         isForgetPassword ? "Back to login" :
                         (isLogin ? "New here? Join ResumePro.ai" : "Already have an account? Sign In")}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
