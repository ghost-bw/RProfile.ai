import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
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
    Home as HomeIcon,
    RefreshCcw
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
    const [customPrompt, setCustomPrompt] = useState('');
    const { sharedFile, setSharedFile } = useFile();
    const navigate = useNavigate();

    const fetchDashboardData = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        setLoading(true);

        try {
            const [userRes, sessionsRes, resumeRes, analyticsRes] = await Promise.allSettled([
                api.get('/auth/user'),
                api.get('/interview/sessions/all'),
                api.get('/resume/latest'),
                api.get('/analytics/user')
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
            const res = await api.post('/resume/upload', formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data'
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
            const res = await api.post('/interview/start', { customPrompt });
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
            await api.post('/auth/update-profile', profileData);
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
        <div className="min-h-screen bg-[#F8FAFC] text-[#334155] font-sans pb-16">
            {/* Navbar */}
            <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 shadow-sm w-full">
                <div className="w-full px-4 md:px-8 py-3.5 flex justify-between items-center">
                    <div 
                        className="flex items-center space-x-2 cursor-pointer"
                        onClick={() => navigate(localStorage.getItem('token') ? '/dashboard' : '/')}
                    >
                        <img src={logo} alt="RProfile.ai Logo" className="w-8.5 h-8.5 rounded-lg" />
                        <span className="text-xl font-black text-[#1E3A8A] tracking-tight font-serif">RProfile<span className="text-blue-500">.ai</span></span>
                    </div>
                    <div className="flex items-center space-x-5">
                        <button 
                            onClick={() => navigate('/')}
                            className="flex items-center space-x-1.5 text-slate-500 hover:text-[#1E3A8A] text-sm font-semibold transition"
                        >
                            <HomeIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">Home</span>
                        </button>
                        {userData && (
                            <button 
                                onClick={() => setShowProfileModal(true)}
                                className="flex items-center space-x-2 bg-blue-50/70 px-3.5 py-1.5 rounded-xl border border-blue-100/50 hover:bg-blue-100/70 transition"
                            >
                                <div className="bg-[#1E3A8A] p-1 rounded-md">
                                    <UserIcon className="text-white w-3 h-3" />
                                </div>
                                <span className="font-bold text-[#1E3A8A] text-xs">{userData.name}</span>
                            </button>
                        )}
                        <button 
                            onClick={handleLogout}
                            className="flex items-center space-x-1.5 text-slate-500 hover:text-red-600 text-sm font-semibold transition"
                        >
                            <LogOutIcon className="w-4.5 h-4.5" />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </nav>

            <main className="w-full px-4 md:px-8 py-8">
                {/* Profile Modal */}
                {showProfileModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-md rounded-2xl p-8 shadow-2xl relative border border-slate-100">
                            <button 
                                onClick={() => setShowProfileModal(false)}
                                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
                            >
                                <XIcon className="w-5 h-5" />
                            </button>
                            <h2 className="text-xl font-bold text-slate-800 mb-6">Update Profile</h2>
                            <form onSubmit={updateProfile} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
                                        <input 
                                            type="text" 
                                            value={profileData.name}
                                            onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition text-sm text-slate-700"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">New Password (Optional)</label>
                                    <div className="relative">
                                        <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
                                        <input 
                                            type="password" 
                                            placeholder="Leave blank to keep current"
                                            value={profileData.password}
                                            onChange={(e) => setProfileData({...profileData, password: e.target.value})}
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition text-sm text-slate-700"
                                        />
                                    </div>
                                </div>
                                <button className="w-full py-3 bg-[#1E3A8A] text-white rounded-xl text-sm font-bold hover:bg-[#152A63] transition shadow-md shadow-blue-100">
                                    Save Changes
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* User Welcome Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Welcome back, {userData ? userData.name.split(' ')[0] : 'User'}! 👋</h1>
                    <p className="text-slate-400 text-sm font-medium mt-1">Here's your interview preparation overview.</p>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
                        <div className="bg-blue-50/70 p-3 rounded-xl text-[#1E3A8A]">
                            <TrendingUpIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Average Score</p>
                            <p className="text-2xl font-black text-slate-800 mt-0.5">{averageScore}/10</p>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
                        <div className="bg-emerald-50/70 p-3 rounded-xl text-emerald-600">
                            <HistoryIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Sessions</p>
                            <p className="text-2xl font-black text-emerald-700 mt-0.5">{sessions.length}</p>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
                        <div className="bg-purple-50/70 p-3 rounded-xl text-purple-600">
                            <AwardIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Top Skill Focus</p>
                            <p className="text-2xl font-black text-purple-700 mt-0.5">{topSkill}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Actions */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* New Feature Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div 
                                onClick={() => navigate('/coding-round')}
                                className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-md hover:shadow-blue-50/30 transition duration-300 cursor-pointer group"
                            >
                                <div className="bg-blue-50 p-3 rounded-xl w-fit mb-4 group-hover:bg-[#1E3A8A] group-hover:text-white transition-colors duration-300">
                                    <CodeIcon className="w-6 h-6 text-[#1E3A8A] group-hover:text-white" />
                                </div>
                                <h3 className="text-base font-bold text-slate-800 mb-1">Coding Round</h3>
                                <p className="text-slate-400 text-xs leading-relaxed">Practice technical coding interviews with real-time AI evaluation.</p>
                            </div>
                            <div 
                                onClick={() => navigate('/aptitude-round')}
                                className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-50/30 transition duration-300 cursor-pointer group"
                            >
                                <div className="bg-emerald-50 p-3 rounded-xl w-fit mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                                    <Brain className="w-6 h-6 text-emerald-600 group-hover:text-white" />
                                </div>
                                <h3 className="text-base font-bold text-slate-800 mb-1">Aptitude Round</h3>
                                <p className="text-slate-400 text-xs leading-relaxed">Test your cognitive skills with competitive maths and reasoning.</p>
                            </div>
                            <div 
                                onClick={() => navigate('/analytics')}
                                className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-purple-200 hover:shadow-md hover:shadow-purple-50/30 transition duration-300 cursor-pointer group"
                            >
                                <div className="bg-purple-50 p-3 rounded-xl w-fit mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
                                    <BarChartIcon className="w-6 h-6 text-purple-600 group-hover:text-white" />
                                </div>
                                <h3 className="text-base font-bold text-slate-800 mb-1">Analytics</h3>
                                <p className="text-slate-400 text-xs leading-relaxed">Track performance trends, strengths, and roadmap recommendations.</p>
                            </div>
                        </div>

                        {/* Consolidated Prep Area */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.01)]">
                            <div className="border-b border-slate-100 pb-4 mb-5">
                                <h2 className="text-lg font-bold text-slate-800 flex items-center">
                                    <PlayIcon className="mr-2 text-blue-600 w-5 h-5 fill-blue-600/10" /> Prepare Mock Interview
                                </h2>
                                <p className="text-xs text-slate-400 mt-1">Configure your focus areas and sync your resume to launch a personalized copilot session.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left Side: Config & Resume */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">1. Resume Upload (PDF)</label>
                                        <div className="border border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-blue-400 transition cursor-pointer bg-slate-50/50">
                                            <input 
                                                type="file" 
                                                accept=".pdf" 
                                                onChange={handleFileChange}
                                                className="hidden" 
                                                id="resume-upload"
                                            />
                                            <label htmlFor="resume-upload" className="cursor-pointer">
                                                <FileTextIcon className="w-7 h-7 text-slate-400 mx-auto mb-1.5" />
                                                <p className="text-xs text-slate-500 font-semibold truncate max-w-xs">{file ? file.name : 'Select PDF Resume'}</p>
                                            </label>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleUpload()}
                                        disabled={loading || !file}
                                        className="w-full py-2.5 bg-[#1E3A8A] text-white rounded-xl text-xs font-bold hover:bg-blue-800 transition disabled:opacity-50 flex items-center justify-center space-x-2"
                                    >
                                        {loading && <RefreshCcw className="w-3.5 h-3.5 animate-spin" />}
                                        <span>{loading ? 'Processing...' : 'Sync Resume'}</span>
                                    </button>
                                </div>

                                {/* Right Side: Custom Focus & Launch */}
                                <div className="flex flex-col justify-between space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">2. Custom Focus (Optional)</label>
                                        <textarea
                                            value={customPrompt}
                                            onChange={(e) => setCustomPrompt(e.target.value)}
                                            placeholder="e.g., Focus on React hooks, system design, or Node.js backend..."
                                            className="w-full h-24 p-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition resize-none text-xs font-medium text-slate-700"
                                        ></textarea>
                                    </div>
                                    <button
                                        onClick={startInterview}
                                        disabled={loading}
                                        className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition flex items-center justify-center space-x-1.5"
                                    >
                                        <PlayIcon className="w-3.5 h-3.5 fill-current" />
                                        <span>Launch AI Copilot</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Recent Sessions */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.01)]">
                            <div className="flex justify-between items-center mb-5">
                                <h2 className="text-lg font-bold text-slate-800">Recent Interview Sessions</h2>
                                {sessions.length > 3 && (
                                    <button 
                                        onClick={() => setShowAllSessions(!showAllSessions)}
                                        className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center"
                                    >
                                        {showAllSessions ? (
                                            <>Show Less <ChevronDownIcon className="ml-1 w-3 h-3" /></>
                                        ) : (
                                            <>Show All <ChevronRightIcon className="ml-1 w-3 h-3" /></>
                                        )}
                                    </button>
                                )}
                            </div>
                            <div className="space-y-3">
                                {displayedSessions.map(s => (
                                    <div key={s._id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100 hover:border-blue-200 transition duration-200 group">
                                        <div className="flex items-center space-x-3.5">
                                            <div className="bg-white p-2.5 rounded-lg shadow-sm border border-slate-100 group-hover:bg-blue-50 transition-colors">
                                                <HistoryIcon className="text-slate-500 w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-slate-700">{new Date(s.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                                <p className="text-xs text-slate-400 font-medium">{(s.questions || []).length} questions evaluated</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-base font-black text-slate-800">{(s.scores && s.scores.length > 0) ? (s.scores.reduce((a,b)=>a+b,0)/s.scores.length).toFixed(1) : 0}/10</p>
                                            <button 
                                                onClick={() => navigate(`/interview/${s._id}`)}
                                                className="text-xs text-blue-600 font-bold hover:underline"
                                            >
                                                Review Report
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {sessions.length === 0 && (
                                    <div className="text-center text-slate-400 py-8 text-xs font-medium bg-slate-50/50 rounded-xl border border-dashed border-slate-100">
                                        No mock interviews recorded yet. Sync your resume to begin.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Insights */}
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-slate-900 to-blue-950 p-6 rounded-2xl text-white shadow-lg shadow-blue-950/10 border border-slate-850">
                            <h3 className="text-sm font-bold mb-4 flex items-center">
                                <TrendingUpIcon className="mr-2 w-4 h-4 text-blue-400" /> AI Performance Insights
                            </h3>
                            <div className="space-y-5">
                                <div>
                                    <div className="flex justify-between mb-1.5">
                                        <p className="text-slate-350 text-xs font-medium">Technical Accuracy</p>
                                        <span className="text-xs font-bold text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded">
                                            {analyticsData ? (analyticsData.metrics.avgAccuracy * 10).toFixed(0) : 0}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                                        <div 
                                            className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full transition-all duration-1000" 
                                            style={{ width: `${analyticsData ? (analyticsData.metrics.avgAccuracy * 10) : 0}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between mb-1.5">
                                        <p className="text-slate-350 text-xs font-medium">Preparation Consistency</p>
                                        <span className="text-xs font-bold text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded">
                                            {analyticsData ? analyticsData.metrics.consistency : 0}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                                        <div 
                                            className="bg-gradient-to-r from-violet-500 to-fuchsia-400 h-full transition-all duration-1000" 
                                            style={{ width: `${analyticsData ? analyticsData.metrics.consistency : 0}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 pt-5 border-t border-slate-800/60">
                                <p className="text-xs text-slate-350 leading-relaxed italic">
                                    "{analyticsData?.aiInsight || "Complete your first interview to unlock personalized AI insights and performance tracking."}"
                                </p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.01)]">
                            <h3 className="text-sm font-bold mb-3 text-slate-800">Resume Optimization</h3>
                            <button 
                                onClick={() => navigate('/ats-check')}
                                className="w-full mb-5 py-2 bg-blue-50/55 text-[#1E3A8A] rounded-xl font-bold text-xs hover:bg-blue-50 transition border border-blue-100/50 flex items-center justify-center"
                            >
                                <TrendingUpIcon className="w-3.5 h-3.5 mr-1.5" /> Run Detailed ATS Check
                            </button>
                            <ul className="space-y-3">
                                {latestResume && latestResume.improvementTips && latestResume.improvementTips.length > 0 ? (
                                    latestResume.improvementTips.slice(0, 3).map((tip, index) => (
                                        <li key={index} className="flex items-start space-x-2.5 text-xs text-slate-650">
                                            <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                                                index === 0 ? 'bg-emerald-500' : index === 1 ? 'bg-blue-500' : 'bg-purple-500'
                                            }`} />
                                            <span className="leading-relaxed">{tip}</span>
                                        </li>
                                    ))
                                ) : (
                                    <li className="flex items-start space-x-2 text-xs text-slate-400 italic">
                                        <span>No optimization suggestions. Upload a resume above to scan improvement points.</span>
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
