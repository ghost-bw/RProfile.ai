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
        <div className="min-h-screen bg-[#F8FAFC] text-gray-800 font-sans pb-20">
            <nav className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                <div 
                    className="flex items-center space-x-2 cursor-pointer"
                    onClick={() => navigate('/')}
                >
                    <div className="bg-[#1E3A8A] p-2 rounded-lg">
                        <Award className="text-white w-6 h-6" />
                    </div>
                    <span className="text-2xl font-black text-[#1E3A8A] tracking-tight font-serif">RProfile<span className="text-blue-500">.ai</span></span>
                </div>
                <button 
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center space-x-2 text-gray-500 hover:text-[#1E3A8A] font-medium transition"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back to Dashboard</span>
                </button>
            </nav>

            <main className="container mx-auto px-6 py-10 max-w-5xl">
                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Job Description Input */}
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                            <h2 className="text-2xl font-bold mb-4">Target Job Description</h2>
                            <p className="text-gray-500 mb-6 italic text-sm">Paste the job description here for a tailored ATS match analysis.</p>
                            <textarea
                                className="w-full h-48 p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none text-gray-700"
                                placeholder="Paste job requirements here..."
                                value={jd}
                                onChange={(e) => setJd(e.target.value)}
                            ></textarea>
                            <button
                                onClick={handleAnalyze}
                                disabled={analyzing || !jd.trim()}
                                className="mt-4 w-full bg-[#1E3A8A] text-white py-4 rounded-2xl font-bold hover:bg-blue-800 transition disabled:opacity-50 flex items-center justify-center space-x-2"
                            >
                                {analyzing ? <RefreshCcw className="animate-spin w-5 h-5" /> : null}
                                <span>{analyzing ? "Analyzing Match..." : "Analyze Match Percentage"}</span>
                            </button>
                        </div>

                        {/* Analysis Results */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="bg-gradient-to-r from-[#1E3A8A] to-blue-700 p-10 text-white text-center">
                                <h1 className="text-4xl font-black mb-2">{analysis ? "JD Match Report" : "General ATS Report"}</h1>
                                <p className="text-blue-100 opacity-80">{analysis ? "Tailored analysis for your target role" : "Base compatibility analysis"}</p>
                            </div>
                            
                            <div className="p-10 flex flex-col md:flex-row items-center justify-around border-b border-gray-50">
                                <div className="relative w-48 h-48 mb-8 md:mb-0">
                                    <svg className="w-full h-full" viewBox="0 0 36 36">
                                        <path
                                            className="text-gray-100 stroke-current"
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
                                        <span className={`text-5xl font-black ${scoreColor}`}>{currentScore}</span>
                                        <span className="text-gray-400 font-bold text-sm uppercase">Score</span>
                                    </div>
                                </div>

                                <div className="max-w-sm">
                                    <h3 className="text-2xl font-bold mb-3">Overall Standing</h3>
                                    <p className="text-gray-500 leading-relaxed mb-4">
                                        Your resume has an ATS score of <span className={`font-bold ${scoreColor}`}>{currentScore}%</span>. 
                                        {currentScore >= 80 ? ' Excellent match! High visibility potential.' : 
                                         currentScore >= 60 ? ' Good start, but needs specific keyword optimization.' : 
                                         ' Needs significant work to pass automated filters.'}
                                    </p>
                                </div>
                            </div>

                            {analysis && analysis.missingSkills && (
                                <div className="p-10 border-b border-gray-100">
                                    <h3 className="text-xl font-bold mb-4 flex items-center text-red-500">
                                        <AlertCircle className="mr-2 w-5 h-5" /> Missing Skills & Keywords
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {analysis.missingSkills.map((skill, index) => (
                                            <span key={index} className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-sm font-bold border border-red-100">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="p-10 bg-gray-50/50">
                                <h2 className="text-2xl font-bold mb-8 flex items-center">
                                    <CheckCircle className="mr-3 text-green-500" /> Improvement Tips
                                </h2>
                                <div className="grid gap-4">
                                    {currentTips.map((tip, index) => (
                                        <div key={index} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-start space-x-4">
                                            <div className="bg-blue-50 p-2 rounded-lg text-blue-600 flex-shrink-0">
                                                <Info className="w-5 h-5" />
                                            </div>
                                            <p className="text-gray-700 text-sm font-medium">{tip}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="bg-[#1E3A8A] p-8 rounded-3xl text-white shadow-xl">
                            <h3 className="text-xl font-bold mb-4">Why Tailor?</h3>
                            <p className="text-blue-100 text-sm leading-relaxed mb-6">
                                ATS systems rank candidates based on keyword frequency and relevance to the JD. A 90% match score significantly increases your interview odds.
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-center space-x-3">
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                    <span className="text-sm">Keyword Optimization</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                    <span className="text-sm">Format Verification</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                    <span className="text-sm">Skill Gap Analysis</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                            <h3 className="text-xl font-bold mb-4">Resume Insight</h3>
                            <p className="text-sm text-gray-500 leading-relaxed italic">
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
