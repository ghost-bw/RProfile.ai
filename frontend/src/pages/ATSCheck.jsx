import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { Award, ArrowLeft, CheckCircle, AlertCircle, Info, RefreshCcw } from 'lucide-react';

const ATSCheck = () => {
    const [resume, setResume] = useState(null);
    const [jd, setJd] = useState("");
    const [analysis, setAnalysis] = useState(null);
    const [prevJd, setPrevJd] = useState("");
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchLatestResume = async () => {
            try {
                const res = await api.get('/resume/latest');
                setResume(res.data);
                // Check if there is a cached analysis in session storage
                const cached = sessionStorage.getItem(`ats_analysis_${res.data._id}`);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    setAnalysis(parsed.analysis);
                    setJd(parsed.jd);
                    setPrevJd(parsed.jd);
                }
            } catch (err) {
                console.error('Error fetching resume:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchLatestResume();
    }, []);

    const handleAnalyze = async () => {
        if (!jd.trim()) return;
        if (jd.trim() === prevJd) return; // Prevent re-analyzing same JD

        setAnalyzing(true);
        try {
            const res = await api.post('/resume/analyze-jd', { jd });
            setAnalysis(res.data);
            setPrevJd(jd.trim());
            // Cache result
            sessionStorage.setItem(`ats_analysis_${resume._id}`, JSON.stringify({ analysis: res.data, jd: jd.trim() }));
        } catch (err) {
            console.error('Error analyzing JD:', err);
        } finally {
            setAnalyzing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <div className="text-center">
                    <RefreshCcw className="w-12 h-12 text-[#1E3A8A] animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Analyzing your ATS compatibility...</p>
                </div>
            </div>
        );
    }

    if (!resume) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 text-center max-w-md">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">No Resume Found</h2>
                    <p className="text-gray-500 mb-6">You need to upload a resume first to see your ATS score and tips.</p>
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="bg-[#1E3A8A] text-white px-8 py-3 rounded-2xl font-bold hover:bg-[#152A63] transition"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const currentScore = analysis ? analysis.score : resume.atsScore;
    const currentTips = analysis ? analysis.improvementTips : resume.improvementTips;

    const scoreColor = currentScore >= 80 ? 'text-green-600' : currentScore >= 60 ? 'text-yellow-600' : 'text-red-600';

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-[#334155] font-sans pb-16">
            <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 shadow-sm w-full">
                <div className="w-full px-4 md:px-8 py-3.5 flex justify-between items-center">
                    <div 
                        className="flex items-center space-x-2 cursor-pointer"
                        onClick={() => navigate(localStorage.getItem('token') ? '/dashboard' : '/')}
                    >
                        <div className="bg-[#1E3A8A] p-1.5 rounded-lg">
                            <Award className="text-white w-4.5 h-4.5" />
                        </div>
                        <span className="text-xl font-black text-[#1E3A8A] tracking-tight font-serif">RProfile<span className="text-blue-500">.ai</span></span>
                    </div>
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center space-x-1.5 text-slate-500 hover:text-[#1E3A8A] text-sm font-semibold transition"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Dashboard</span>
                    </button>
                </div>
            </nav>

            <main className="w-full px-4 md:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Job Description Input */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h2 className="text-lg font-bold text-slate-800 mb-1">Target Job Description</h2>
                            <p className="text-slate-400 text-xs mb-4">Paste the job description here for a tailored ATS match analysis.</p>
                            <textarea
                                className="w-full h-40 p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none text-slate-700 text-xs font-medium"
                                placeholder="Paste job requirements here..."
                                value={jd}
                                onChange={(e) => setJd(e.target.value)}
                            ></textarea>
                            <button
                                onClick={handleAnalyze}
                                disabled={analyzing || !jd.trim()}
                                className="mt-3 w-full bg-[#1E3A8A] text-white py-2.5 rounded-xl text-xs font-bold hover:bg-blue-800 transition disabled:opacity-50 flex items-center justify-center space-x-2 shadow-sm"
                            >
                                {analyzing ? <RefreshCcw className="animate-spin w-4 h-4" /> : null}
                                <span>{analyzing ? "Analyzing Match..." : "Analyze Match Percentage"}</span>
                            </button>
                        </div>

                        {/* Analysis Results */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="bg-gradient-to-r from-[#1E3A8A] to-blue-700 p-6 text-white text-center">
                                <h1 className="text-xl font-black">{analysis ? "JD Match Report" : "General ATS Report"}</h1>
                                <p className="text-blue-100 opacity-80 text-xs mt-1">{analysis ? "Tailored analysis for your target role" : "Base compatibility analysis"}</p>
                            </div>
                            
                            <div className="p-6 flex flex-col sm:flex-row items-center justify-around gap-6 border-b border-slate-50">
                                <div className="relative w-36 h-36 flex-shrink-0">
                                    <svg className="w-full h-full" viewBox="0 0 36 36">
                                        <path
                                            className="text-slate-100 stroke-current"
                                            strokeDasharray="100, 100"
                                            strokeWidth="3"
                                            fill="none"
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                        <path
                                            className={`${scoreColor.replace('text', 'stroke')} stroke-current transition-all duration-1000 ease-out`}
                                            strokeDasharray={`${currentScore}, 100`}
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            fill="none"
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className={`text-4xl font-black ${scoreColor}`}>{currentScore}</span>
                                        <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Score</span>
                                    </div>
                                </div>

                                <div className="max-w-sm text-center sm:text-left">
                                    <h3 className="text-base font-bold text-slate-800 mb-1.5">Overall Standing</h3>
                                    <p className="text-slate-500 text-xs leading-relaxed">
                                        Your resume has an ATS score of <span className={`font-bold ${scoreColor}`}>{currentScore}%</span>. 
                                        {currentScore >= 80 ? ' Excellent match! High visibility potential.' : 
                                         currentScore >= 60 ? ' Good start, but needs specific keyword optimization.' : 
                                         ' Needs significant work to pass automated filters.'}
                                    </p>
                                </div>
                            </div>

                            {analysis && analysis.missingSkills && (
                                <div className="p-6 border-b border-slate-50">
                                    <h3 className="text-xs font-bold mb-3 flex items-center text-rose-500 uppercase tracking-wider">
                                        <AlertCircle className="mr-1.5 w-4.5 h-4.5" /> Missing Skills & Keywords
                                    </h3>
                                    <div className="flex flex-wrap gap-1.5">
                                        {analysis.missingSkills.map((skill, index) => (
                                            <span key={index} className="bg-rose-50 text-rose-600 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-rose-100">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="p-6 bg-slate-50/40">
                                <h2 className="text-sm font-bold mb-4 flex items-center text-slate-800 uppercase tracking-wider">
                                    <CheckCircle className="mr-2 text-emerald-500 w-4.5 h-4.5" /> Improvement Recommendations
                                </h2>
                                <div className="grid gap-3">
                                    {currentTips.map((tip, index) => (
                                        <div key={index} className="bg-white p-4 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.01)] border border-slate-100 flex items-start space-x-3">
                                            <div className="bg-blue-50 p-1.5 rounded-md text-blue-600 flex-shrink-0 mt-0.5">
                                                <Info className="w-3.5 h-3.5" />
                                            </div>
                                            <p className="text-slate-600 text-xs font-medium leading-relaxed">{tip}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-sm border border-slate-850">
                            <h3 className="text-sm font-bold mb-3 text-white">Why Tailor Your Resume?</h3>
                            <p className="text-slate-300 text-xs leading-relaxed mb-4">
                                ATS systems rank candidates based on keyword frequency and relevance to the JD. A 90%+ match score significantly increases your interview odds.
                            </p>
                            <div className="space-y-3">
                                <div className="flex items-center space-x-2.5 text-xs">
                                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                                    <span className="text-slate-350">Keyword Optimization</span>
                                </div>
                                <div className="flex items-center space-x-2.5 text-xs">
                                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                                    <span className="text-slate-350">Format Verification</span>
                                </div>
                                <div className="flex items-center space-x-2.5 text-xs">
                                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                                    <span className="text-slate-350">Skill Gap Analysis</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h3 className="text-sm font-bold mb-2 text-slate-800">Resume Insight</h3>
                            <p className="text-xs text-slate-450 leading-relaxed italic">
                                "The best resumes aren't a list of duties, but a portfolio of achievements."
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ATSCheck;
