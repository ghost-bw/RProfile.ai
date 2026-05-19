import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
    Upload as UploadIcon, 
    FileText as FileTextIcon, 
    Play as PlayIcon, 
    History as HistoryIcon, 
    TrendingUp as TrendingUpIcon, 
    Award as AwardIcon, 
    LogOut as LogOutIcon, 
    User as UserIcon, 
    ChevronRight as ChevronRightIcon, 
    ChevronDown as ChevronDownIcon,
    X as XIcon,
    Lock as LockIcon,
    Code as CodeIcon,
    BarChart as BarChartIcon,
    Brain as Brain,
    BookOpen as BookOpenIcon,
    Home as HomeIcon
} from 'lucide-react';
import { useFile } from '../context/FileContext';

import logo from '../assets/Gemini_Generated_Image_ga5zozga5zozga5z.png';

const Dashboard = () => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [resumeText, setResumeText] = useState('');
    const [sessions, setSessions] = useState([]);
    const [latestResume, setLatestResume] = useState(null);
    const [userData, setUserData] = useState(null);
    const [analyticsData, setAnalyticsData] = useState(null);
    const [showAllSessions, setShowAllSessions] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileData, setProfileData] = useState({ name: '', password: '' });
    const { sharedFile, setSharedFile } = useFile();
    const navigate = useNavigate();

    const fetchDashboardData = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const headers = { 'x-auth-token': token };
        setLoading(true);

        try {
            const [userRes, sessionsRes, resumeRes, analyticsRes] = await Promise.allSettled([
                axios.get('http://127.0.0.1:5000/api/auth/user', { headers }),
                axios.get('http://127.0.0.1:5000/api/interview/sessions/all', { headers }),
                axios.get('http://127.0.0.1:5000/api/resume/latest', { headers }),
                axios.get('http://127.0.0.1:5000/api/analytics/user', { headers })
            ]);

            if (userRes.status === 'fulfilled') {
                setUserData(userRes.value.data);
                setProfileData({ name: userRes.value.data.name, password: '' });
            }

            if (sessionsRes.status === 'fulfilled') {
                setSessions(sessionsRes.value.data);
            }

            if (resumeRes.status === 'fulfilled') {
                setLatestResume(resumeRes.value.data);
            }

            if (analyticsRes.status === 'fulfilled') {
                setAnalyticsData(analyticsRes.value.data);
            }
        } catch (err) {
            console.error('Unexpected error fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const handleUpload = useCallback(async (uploadFile) => {
        const fileToUpload = uploadFile || file;
        if (!fileToUpload) return;
        setLoading(true);

        const formData = new FormData();
        formData.append('resume', fileToUpload);

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('http://127.0.0.1:5000/api/resume/upload', formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    'x-auth-token': token
                }
            });
            setResumeText(res.data.originalText);
            setLatestResume(res.data);
            setSharedFile(null); // Clear shared file after successful upload
            alert('Resume uploaded and processed successfully!');
            fetchDashboardData();
        } catch (err) {
            console.error('UPLOAD ERROR:', err);
            const errMsg = err.response?.data?.error || err.response?.data?.msg || 'Failed to upload resume';
            alert(errMsg);
        } finally {
            setLoading(false);
        }
    }, [file, setSharedFile, fetchDashboardData]);

    useEffect(() => {
        if (sharedFile) {
            setFile(sharedFile);
            handleUpload(sharedFile);
        }
    }, [sharedFile, handleUpload]);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const startInterview = async () => {
        if (!latestResume) {
            alert('Please upload your resume first to launch the AI session.');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('http://127.0.0.1:5000/api/interview/start', 
                {}, 
                { headers: { 'x-auth-token': token } }
            );
            navigate(`/interview/${res.data._id}`);
        } catch (err) {
            console.error(err);
            alert('Make sure you have uploaded a resume first.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/';
    };

    const updateProfile = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://127.0.0.1:5000/api/auth/update-profile', profileData, {
                headers: { 'x-auth-token': token }
            });
            alert('Profile updated successfully!');
            setShowProfileModal(false);
            fetchDashboardData();
        } catch (err) {
            alert('Failed to update profile');
        }
    };

    const averageScore = sessions.length > 0 
        ? (sessions.reduce((acc, s) => acc + ((s.scores && s.scores.length > 0) ? (s.scores.reduce((a, b) => a + b, 0) / s.scores.length) : 0), 0) / sessions.length).toFixed(1)
        : 0;

    const getTopSkill = () => {
        if (!latestResume || !latestResume.originalText) return 'N/A';
        const skills = ['React', 'Node.js', 'Python', 'Java', 'C++', 'AWS', 'Docker', 'Kubernetes', 'SQL', 'MongoDB', 'Angular', 'Vue', 'JavaScript', 'TypeScript'];
        const text = String(latestResume.originalText).toLowerCase();
        let maxCount = 0;
        let topSkill = 'N/A';
        
        skills.forEach(skill => {
            const count = (text.match(new RegExp(`\\b${skill.toLowerCase().replace('++', '\\+\\+')}\\b`, 'g')) || []).length;
            if (count > maxCount) {
                maxCount = count;
                topSkill = skill;
            }
        });
        return maxCount > 0 ? topSkill : 'General';
    };
    const topSkill = getTopSkill();

    const displayedSessions = showAllSessions ? sessions : sessions.slice(0, 3);

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-gray-800 font-sans">
            {/* Navbar */}
            <nav className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                <div 
                    className="flex items-center space-x-2 cursor-pointer"
                    onClick={() => navigate('/')}
                >
                    <img src={logo} alt="RProfile.ai Logo" className="w-9 h-9 rounded-lg" />
                    <span className="text-2xl font-black text-[#1E3A8A] tracking-tight font-serif">RProfile<span className="text-blue-500">.ai</span></span>
                </div>
                <div className="flex items-center space-x-6">
                    <button 
                        onClick={() => navigate('/')}
                        className="flex items-center space-x-2 text-gray-500 hover:text-[#1E3A8A] font-medium transition"
                    >
                        <HomeIcon className="w-5 h-5" />
                        <span className="hidden md:inline">Home</span>
                    </button>
                    {userData && (
                        <button 
                            onClick={() => setShowProfileModal(true)}
                            className="flex items-center space-x-3 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 hover:bg-blue-100 transition"
                        >
                            <div className="bg-[#1E3A8A] p-1.5 rounded-lg">
                                <UserIcon className="text-white w-4 h-4" />
                            </div>
                            <span className="font-bold text-[#1E3A8A] text-sm">{userData.name}</span>
                        </button>
                    )}
                    <button 
                        onClick={handleLogout}
                        className="flex items-center space-x-2 text-gray-500 hover:text-red-600 font-medium transition"
                    >
                        <LogOutIcon className="w-5 h-5" />
                        <span className="hidden md:inline">Logout</span>
                    </button>
                </div>
            </nav>

            <main className="container mx-auto px-6 py-10">
                {/* Profile Modal */}
                {showProfileModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl relative">
                            <button 
                                onClick={() => setShowProfileModal(false)}
                                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
                            >
                                <XIcon className="w-6 h-6" />
                            </button>
                            <h2 className="text-2xl font-black text-[#1E3A8A] mb-8">Update Profile</h2>
                            <form onSubmit={updateProfile} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-500 uppercase mb-2">Full Name</label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input 
                                            type="text" 
                                            value={profileData.name}
                                            onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-500 uppercase mb-2">New Password (Optional)</label>
                                    <div className="relative">
                                        <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input 
                                            type="password" 
                                            placeholder="Leave blank to keep current"
                                            value={profileData.password}
                                            onChange={(e) => setProfileData({...profileData, password: e.target.value})}
                                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                </div>
                                <button className="w-full py-4 bg-[#1E3A8A] text-white rounded-2xl font-black hover:bg-[#152A63] transition shadow-lg shadow-blue-100">
                                    Save Changes
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* User Welcome Header */}
                <div className="mb-10">
                    <h1 className="text-3xl font-black text-[#1E3A8A]">Welcome back, {userData ? userData.name.split(' ')[0] : 'User'}! 👋</h1>
                    <p className="text-gray-500 font-medium">Here's what's happening with your interview preparation.</p>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-4">
                        <div className="bg-blue-50 p-4 rounded-2xl text-blue-600">
                            <TrendingUpIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">Average Score</p>
                            <p className="text-3xl font-black text-[#1E3A8A]">{averageScore}/10</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-4">
                        <div className="bg-green-50 p-4 rounded-2xl text-green-600">
                            <HistoryIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">Sessions</p>
                            <p className="text-3xl font-black text-green-700">{sessions.length}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-4">
                        <div className="bg-purple-50 p-4 rounded-2xl text-purple-600">
                            <AwardIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">Top Skill</p>
                            <p className="text-3xl font-black text-purple-700">{topSkill}</p>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left: Actions */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* New Feature Grid */}
                        <div className="grid md:grid-cols-3 gap-6">
                            <div 
                                onClick={() => navigate('/coding-round')}
                                className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:border-blue-400 transition cursor-pointer group"
                            >
                                <div className="bg-blue-50 p-4 rounded-2xl w-fit mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <CodeIcon className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold mb-2 text-[#1E3A8A]">Coding Round</h3>
                                <p className="text-gray-500 text-sm">Practice technical coding interviews with real-time AI evaluation.</p>
                            </div>
                            <div 
                                onClick={() => navigate('/aptitude-round')}
                                className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:border-green-400 transition cursor-pointer group"
                            >
                                <div className="bg-green-50 p-4 rounded-2xl w-fit mb-6 group-hover:bg-green-600 group-hover:text-white transition-colors">
                                    <Brain className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold mb-2 text-[#1E3A8A]">Aptitude Round</h3>
                                <p className="text-gray-500 text-sm">Test your cognitive skills with competitive maths and reasoning.</p>
                            </div>
                            <div 
                                onClick={() => navigate('/analytics')}
                                className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:border-purple-400 transition cursor-pointer group"
                            >
                                <div className="bg-purple-50 p-4 rounded-2xl w-fit mb-6 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                    <BarChartIcon className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold mb-2 text-[#1E3A8A]">Detailed Analytics</h3>
                                <p className="text-gray-500 text-sm">Track your performance trends and mastery across topics.</p>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                            <h2 className="text-2xl font-bold mb-6 flex items-center text-[#1E3A8A]">
                                <UploadIcon className="mr-3 text-blue-500" /> Prepare New Interview
                            </h2>
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider">1. Upload Resume (PDF)</label>
                                    <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-blue-400 transition cursor-pointer bg-gray-50">
                                        <input 
                                            type="file" 
                                            accept=".pdf" 
                                            onChange={handleFileChange}
                                            className="hidden" 
                                            id="resume-upload"
                                        />
                                        <label htmlFor="resume-upload" className="cursor-pointer">
                                            <FileTextIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                            <p className="text-sm text-gray-500 font-medium truncate max-w-xs">{file ? file.name : 'Click to select PDF'}</p>
                                        </label>
                                    </div>
                                    <button
                                        onClick={() => handleUpload()}
                                        disabled={loading || !file}
                                        className="w-full py-4 bg-[#1E3A8A] text-white rounded-2xl font-bold hover:bg-[#152A63] transition shadow-lg shadow-blue-100 disabled:opacity-50"
                                    >
                                        {loading ? 'Processing...' : 'Sync Resume'}
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider">2. Start Session</label>
                                    <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 h-[190px] flex flex-col justify-between">
                                        <p className="text-sm text-blue-700 font-medium">Our AI will analyze your latest resume and adapt questions to your skill level.</p>
                                        <button
                                            onClick={startInterview}
                                            disabled={loading}
                                            className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 transition shadow-lg shadow-green-100 flex items-center justify-center"
                                        >
                                            <PlayIcon className="w-5 h-5 mr-2 fill-current" /> Launch AI Copilot
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Sessions */}
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-[#1E3A8A]">Recent Interviews</h2>
                                {sessions.length > 3 && (
                                    <button 
                                        onClick={() => setShowAllSessions(!showAllSessions)}
                                        className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center"
                                    >
                                        {showAllSessions ? (
                                            <>Show Less <ChevronDownIcon className="ml-1 w-4 h-4" /></>
                                        ) : (
                                            <>Show All Sessions <ChevronRightIcon className="ml-1 w-4 h-4" /></>
                                        )}
                                    </button>
                                )}
                            </div>
                            <div className="space-y-4">
                                {displayedSessions.map(s => (
                                    <div key={s._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-blue-200 transition group">
                                        <div className="flex items-center space-x-4">
                                            <div className="bg-white p-3 rounded-xl shadow-sm group-hover:bg-blue-50 transition">
                                                <HistoryIcon className="text-blue-500 w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-700">{new Date(s.date).toLocaleDateString()} - Session</p>
                                                <p className="text-xs text-gray-400 font-medium">{(s.questions || []).length} Questions Asked</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black text-[#1E3A8A]">{(s.scores && s.scores.length > 0) ? (s.scores.reduce((a,b)=>a+b,0)/s.scores.length).toFixed(1) : 0}/10</p>
                                            <button 
                                                onClick={() => navigate(`/interview/${s._id}`)}
                                                className="text-xs text-blue-600 font-bold hover:underline"
                                            >
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {sessions.length === 0 && <p className="text-center text-gray-400 py-10">No interviews yet. Start your first session!</p>}
                            </div>
                        </div>
                    </div>

                    {/* Right: Insights */}
                    <div className="space-y-8">
                        <div className="bg-gradient-to-br from-[#1E3A8A] to-blue-700 p-8 rounded-3xl text-white shadow-xl shadow-blue-200">
                            <h3 className="text-xl font-bold mb-4 flex items-center">
                                <TrendingUpIcon className="mr-2" /> AI Insights
                            </h3>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <p className="text-blue-100 text-sm font-medium">Technical Accuracy</p>
                                        <span className="text-xs font-bold bg-blue-900/40 px-2 py-0.5 rounded">{analyticsData ? (analyticsData.metrics.avgAccuracy * 10).toFixed(0) : 0}%</span>
                                    </div>
                                    <div className="w-full bg-blue-900/30 h-2 rounded-full overflow-hidden">
                                        <div 
                                            className="bg-green-400 h-full transition-all duration-1000" 
                                            style={{ width: `${analyticsData ? (analyticsData.metrics.avgAccuracy * 10) : 0}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <p className="text-blue-100 text-sm font-medium">Preparation Consistency</p>
                                        <span className="text-xs font-bold bg-blue-900/40 px-2 py-0.5 rounded">{analyticsData ? analyticsData.metrics.consistency : 0}%</span>
                                    </div>
                                    <div className="w-full bg-blue-900/30 h-2 rounded-full overflow-hidden">
                                        <div 
                                            className="bg-yellow-400 h-full transition-all duration-1000" 
                                            style={{ width: `${analyticsData ? analyticsData.metrics.consistency : 0}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-8 pt-6 border-t border-blue-400/30">
                                <p className="text-xs text-blue-100 leading-relaxed italic">
                                    {analyticsData ? analyticsData.aiInsight : "Complete your first interview to unlock personalized AI insights and performance tracking."}
                                </p>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold mb-2 text-[#1E3A8A]">Resume Improvement</h3>
                            <button 
                                onClick={() => navigate('/ats-check')}
                                className="w-full mb-6 py-3 bg-blue-50 text-[#1E3A8A] rounded-xl font-bold text-sm hover:bg-blue-100 transition border border-blue-100 flex items-center justify-center"
                            >
                                <TrendingUpIcon className="w-4 h-4 mr-2" /> Check Full ATS Score
                            </button>
                            <ul className="space-y-4">
                                {latestResume && latestResume.improvementTips && latestResume.improvementTips.length > 0 ? (
                                    latestResume.improvementTips.slice(0, 3).map((tip, index) => (
                                        <li key={index} className="flex items-start space-x-3 text-sm">
                                            <div className={`w-2 h-2 ${index === 0 ? 'bg-green-500' : index === 1 ? 'bg-blue-500' : 'bg-purple-500'} rounded-full mt-1.5 flex-shrink-0`}></div>
                                            <span className="text-gray-600">{tip}</span>
                                        </li>
                                    ))
                                ) : (
                                    <li className="flex items-start space-x-3 text-sm">
                                        <div className="w-2 h-2 bg-gray-300 rounded-full mt-1.5 flex-shrink-0"></div>
                                        <span className="text-gray-400">No tips available. Upload a resume to get started.</span>
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
