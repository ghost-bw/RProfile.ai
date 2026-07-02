import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    BarChart, Bar, Legend
} from 'recharts';
import { Award, TrendingUp, Target, Zap, BookOpen, ChevronRight, RefreshCcw, ArrowLeft, BrainCircuit, Download, FileText, Terminal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const AnalyticsDashboard = () => {
    const [data, setData] = useState(null);
    const [codingStats, setCodingStats] = useState(null);
    const [roadmap, setRoadmap] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingRoadmap, setLoadingRoadmap] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [isDownloading, setIsDownloading] = useState(false);
    const navigate = useNavigate();
    const roadmapRef = useRef(null);

    const downloadPDF = async () => {
        if (!roadmapRef.current) {
            console.error('Roadmap reference is null');
            return;
        }
        
        setIsDownloading(true);
        console.log('Starting PDF generation...');
        
        try {
            const element = roadmapRef.current;
            
            // 1. Create a clone for capture to avoid messing with the UI
            const clone = element.cloneNode(true);
            document.body.appendChild(clone);
            
            // 2. Force ultra-simple styles on the clone
            clone.style.position = 'absolute';
            clone.style.left = '-9999px';
            clone.style.top = '0';
            clone.style.width = '800px';
            clone.style.background = 'white';
            clone.style.color = 'black';
            clone.style.padding = '40px';
            clone.style.height = 'auto';
            
            // 3. Deep-clean all modern CSS features that break html2canvas
            const allCloneElements = clone.querySelectorAll('*');
            allCloneElements.forEach(el => {
                el.style.color = 'black';
                el.style.backgroundColor = 'transparent';
                el.style.borderColor = '#cccccc';
                el.style.boxShadow = 'none';
                el.style.textShadow = 'none';
                el.style.filter = 'none';
                el.style.backgroundImage = 'none';
                // Remove modern tailwind colors like oklch
                el.className = ''; 
                el.style.fontFamily = 'Arial, sans-serif';
            });

            console.log('Capturing canvas...');
            const canvas = await html2canvas(clone, {
                scale: 1.5,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: true, // Enable for detailed logs in console
                onclone: (doc) => {
                    console.log('html2canvas clone created');
                }
            });

            document.body.removeChild(clone);

            console.log('Converting to PDF...');
            const imgData = canvas.toDataURL('image/jpeg', 0.8);
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            const imgWidth = pdfWidth - 20; 
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            let heightLeft = imgHeight;
            let position = 10;

            pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight);
            heightLeft -= (pdfHeight - 20);

            while (heightLeft > 0) {
                position = heightLeft - imgHeight - 10;
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight);
                heightLeft -= (pdfHeight - 20);
            }

            pdf.save(`Roadmap_${new Date().getTime()}.pdf`);
            console.log('PDF saved successfully');
        } catch (err) {
            console.error('CRITICAL PDF ERROR:', err);
            alert('PDF download failed. Please try using "Print to PDF" (Ctrl+P) in your browser as a reliable alternative.');
        } finally {
            setIsDownloading(false);
        }
    };
    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const [analyticsRes, codingRes] = await Promise.all([
                    api.get('/analytics/user'),
                    api.get('/analytics/coding-stats')
                ]);
                setData(analyticsRes.data);
                setCodingStats(codingRes.data);
            } catch (err) {
                console.error('Error fetching data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, []);

    const fetchRoadmap = async () => {
        setLoadingRoadmap(true);
        setErrorMsg('');
        try {
            const res = await api.get('/analytics/roadmap');
            setRoadmap(res.data.roadmap);
        } catch (err) {
            console.error('Error fetching roadmap:', err);
            if (err.response && err.response.status === 400) {
                setErrorMsg(err.response.data.msg);
            } else {
                setErrorMsg('Failed to generate roadmap. Please try again later.');
            }
        } finally {
            setLoadingRoadmap(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <RefreshCcw className="w-12 h-12 text-[#1E3A8A] animate-spin" />
            </div>
        );
    }

    const radarData = data ? Object.keys(data.topicPerformance).map(topic => ({
        topic,
        score: data.topicPerformance[topic],
        fullMark: 10
    })) : [];

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-[#334155] font-sans pb-16">
            <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 shadow-sm w-full">
                <div className="w-full px-4 md:px-8 py-3.5 flex justify-between items-center">
                    <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate(localStorage.getItem('token') ? '/dashboard' : '/')}>
                        <div className="bg-[#1E3A8A] p-1.5 rounded-lg">
                            <Award className="text-white w-4.5 h-4.5" />
                        </div>
                        <span className="text-xl font-black text-[#1E3A8A] tracking-tight font-serif">ResumePro<span className="text-blue-500">.ai</span></span>
                    </div>
                    <button onClick={() => navigate('/dashboard')} className="flex items-center space-x-1.5 text-slate-500 hover:text-[#1E3A8A] text-sm font-semibold transition">
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Dashboard</span>
                    </button>
                </div>
            </nav>

            <main className="w-full px-4 md:px-8 py-8">
                <header className="mb-8">
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Performance Analytics</h1>
                    <p className="text-slate-400 text-sm font-medium mt-1">Track your growth and identify areas for improvement.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
                        <div className="bg-blue-50/70 p-3 rounded-xl text-[#1E3A8A]">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Avg. Accuracy</h3>
                            <div className="text-xl font-black text-slate-800 mt-0.5">{data?.metrics.avgAccuracy}/10</div>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
                        <div className="bg-emerald-50/70 p-3 rounded-xl text-emerald-600">
                            <Zap className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Consistency</h3>
                            <div className="text-xl font-black text-slate-800 mt-0.5">{data?.metrics.consistency}%</div>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4 group relative cursor-help">
                        <div className="bg-purple-50/70 p-3 rounded-xl text-purple-600">
                            <Target className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Strong Areas</h3>
                            <div className="text-xl font-black text-slate-800 mt-0.5">{data?.strongTopics.length}</div>
                        </div>
                        
                        {/* Tooltip for Strong Areas */}
                        {data?.strongTopics && data.strongTopics.length > 0 && (
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-slate-900 text-white text-[11px] p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none shadow-xl border border-slate-800">
                                <div className="font-bold mb-1.5 border-b border-slate-800 pb-1 text-purple-400">Mastered Topics</div>
                                <ul className="space-y-1">
                                    {data.strongTopics.map((topic, i) => (
                                        <li key={i} className="flex items-center">
                                            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2"></div>
                                            {topic}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4 group relative cursor-help">
                        <div className="bg-rose-50/70 p-3 rounded-xl text-rose-600">
                            <BrainCircuit className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Weak Areas</h3>
                            <div className="text-xl font-black text-slate-800 mt-0.5">{data?.weakTopics.length}</div>
                        </div>

                        {/* Tooltip for Weak Areas */}
                        {data?.weakTopics && data.weakTopics.length > 0 && (
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-slate-900 text-white text-[11px] p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none shadow-xl border border-slate-800">
                                <div className="font-bold mb-1.5 border-b border-slate-800 pb-1 text-rose-450">Topics to Improve</div>
                                <ul className="space-y-1">
                                    {data.weakTopics.map((topic, i) => (
                                        <li key={i} className="flex items-center">
                                            <div className="w-1.5 h-1.5 bg-rose-500 rounded-full mr-2"></div>
                                            {topic}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                {/* Coding Progress Section */}
                <div className="mb-8">
                    <h2 className="text-lg font-bold mb-5 flex items-center text-slate-800">
                        <Terminal className="mr-2 text-blue-600 w-5 h-5" /> Coding Proficiency
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm relative overflow-hidden group border border-slate-850">
                            <div className="relative z-10">
                                <h3 className="text-slate-450 text-[10px] font-bold uppercase tracking-wider mb-1">Total Solved</h3>
                                <div className="text-3xl font-black tracking-tight">{codingStats?.totalSolved || 0}</div>
                            </div>
                            <Award className="absolute -right-3 -bottom-3 w-20 h-20 text-white/5 group-hover:text-blue-500/10 transition-colors" />
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                            <h3 className="text-emerald-600 text-[10px] font-black uppercase tracking-wider mb-1">Easy</h3>
                            <div className="text-2xl font-black text-slate-855">{codingStats?.easy || 0}</div>
                            <div className="w-full bg-slate-50 h-1.5 rounded-full mt-3 overflow-hidden">
                                <div 
                                    className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out" 
                                    style={{ width: `${codingStats?.totalSolved ? (codingStats.easy / codingStats.totalSolved) * 100 : 0}%` }}
                                ></div>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                            <h3 className="text-amber-600 text-[10px] font-black uppercase tracking-wider mb-1">Medium</h3>
                            <div className="text-2xl font-black text-slate-855">{codingStats?.medium || 0}</div>
                            <div className="w-full bg-slate-50 h-1.5 rounded-full mt-3 overflow-hidden">
                                <div 
                                    className="bg-amber-500 h-full rounded-full transition-all duration-1000 ease-out" 
                                    style={{ width: `${codingStats?.totalSolved ? (codingStats.medium / codingStats.totalSolved) * 100 : 0}%` }}
                                ></div>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                            <h3 className="text-rose-600 text-[10px] font-black uppercase tracking-wider mb-1">Hard</h3>
                            <div className="text-2xl font-black text-slate-855">{codingStats?.hard || 0}</div>
                            <div className="w-full bg-slate-50 h-1.5 rounded-full mt-3 overflow-hidden">
                                <div 
                                    className="bg-rose-500 h-full rounded-full transition-all duration-1000 ease-out" 
                                    style={{ width: `${codingStats?.totalSolved ? (codingStats.hard / codingStats.totalSolved) * 100 : 0}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Score Trend */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="text-base font-bold mb-4 text-slate-850">Interview Score Trend</h3>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data?.scoreTrends}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F8FAFC" />
                                    <XAxis dataKey="date" tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})} stroke="#94A3B8" fontSize={11} />
                                    <YAxis domain={[0, 10]} stroke="#94A3B8" fontSize={11} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="avgScore" stroke="#1E3A8A" strokeWidth={3.5} dot={{ r: 5, fill: '#1E3A8A' }} activeDot={{ r: 7 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Topic Mastery */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="text-base font-bold mb-4 text-slate-855">Topic Mastery Breakdown</h3>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                    <PolarGrid stroke="#F1F5F9" />
                                    <PolarAngleAxis dataKey="topic" stroke="#64748B" fontSize={10} />
                                    <PolarRadiusAxis angle={30} domain={[0, 10]} stroke="#94A3B8" fontSize={9} />
                                    <Radar name="Score" dataKey="score" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.4} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Recent Solutions & Roadmap */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 h-[500px] flex flex-col">
                            <h3 className="text-base font-bold mb-4 flex items-center shrink-0 text-slate-855">
                                <RefreshCcw className="mr-2 text-slate-400 w-4 h-4" /> Recent Solved
                            </h3>
                            <div className="flex-1 overflow-y-auto custom-roadmap-scrollbar space-y-3 pr-1">
                                {codingStats?.recentSolved?.length > 0 ? codingStats.recentSolved.map((prob, i) => (
                                    <div key={i} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/50 border border-slate-100 transition hover:border-blue-200">
                                        <div>
                                            <div className="font-bold text-slate-700 text-xs">{prob.title}</div>
                                            <div className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{new Date(prob.solvedAt).toLocaleDateString()}</div>
                                        </div>
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded ${
                                            prob.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                            prob.difficulty === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                            'bg-rose-50 text-rose-700 border border-rose-100'
                                        }`}>
                                            {prob.difficulty}
                                        </span>
                                    </div>
                                )) : (
                                    <p className="text-slate-400 text-xs italic text-center mt-10">No problems solved yet.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        {/* Personalized Roadmap */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-[500px] flex flex-col">
                            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/30 shrink-0">
                                <div>
                                    <h3 className="text-base font-bold flex items-center text-slate-855">
                                        <BookOpen className="mr-2 text-blue-600 w-4.5 h-4.5" /> AI Study Roadmap
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-0.5 font-medium">Personalized 7-day plan to tackle weak areas.</p>
                                </div>
                                <div className="flex space-x-3">
                                    {roadmap && (
                                        <button 
                                            onClick={downloadPDF}
                                            disabled={isDownloading}
                                            className="bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-xl font-bold hover:bg-slate-50 transition disabled:opacity-50 flex items-center shadow-sm text-xs"
                                        >
                                            {isDownloading ? <RefreshCcw className="animate-spin mr-1.5 w-3.5 h-3.5" /> : <Download className="mr-1.5 w-3.5 h-3.5" />}
                                            PDF
                                        </button>
                                    )}
                                    <button 
                                        onClick={fetchRoadmap}
                                        disabled={loadingRoadmap}
                                        className="bg-[#1E3A8A] text-white px-3 py-1.5 rounded-xl font-bold hover:bg-blue-800 transition disabled:opacity-50 flex items-center shadow-md shadow-blue-100 text-xs"
                                    >
                                        {loadingRoadmap ? <RefreshCcw className="animate-spin mr-1.5 w-3.5 h-3.5" /> : <Zap className="mr-1.5 w-3.5 h-3.5" />}
                                        {roadmap ? "Regenerate" : "Generate"}
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 custom-roadmap-scrollbar relative">
                                {errorMsg && (
                                    <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-xs font-bold mb-4 border border-rose-100 text-center">
                                        {errorMsg}
                                    </div>
                                )}
                                {roadmap ? (
                                    <div ref={roadmapRef} className="bg-white p-1 rounded-xl roadmap-markdown-container">
                                        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-100">
                                            <div className="bg-[#1E3A8A] p-2 rounded-lg">
                                                <Award className="text-white w-5 h-5" />
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-black text-[#1E3A8A]">Elite Preparation Roadmap</h2>
                                                <p className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Personalized 7-Day Plan</p>
                                            </div>
                                        </div>
                                        <div className="prose prose-blue max-w-none 
                                            prose-headings:text-[#1E3A8A] prose-headings:font-black 
                                            prose-h1:text-2xl prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4
                                            prose-h2:bg-blue-50/60 prose-h2:p-3 prose-h2:rounded-xl prose-h2:border-l-4 prose-h2:border-blue-600
                                            prose-p:text-slate-650 prose-p:leading-relaxed prose-p:font-medium prose-p:text-xs
                                            prose-li:text-slate-650 prose-li:font-medium prose-li:text-xs
                                            prose-strong:text-[#1E3A8A] prose-strong:font-black
                                            prose-em:text-blue-600 prose-em:italic prose-em:font-bold">
                                            <ReactMarkdown>{roadmap}</ReactMarkdown>
                                        </div>
                                        <div className="mt-12 pt-6 border-t border-slate-100 text-center">
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">© 2026 RProfile.ai • Your Path to the Elite 1%</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-16 h-full flex flex-col justify-center items-center">
                                        <div className="bg-blue-50/80 p-4 rounded-full w-fit mb-4 text-blue-600">
                                            <BookOpen className="text-blue-300 w-8 h-8" />
                                        </div>
                                        <h4 className="text-base font-bold text-slate-400">No study roadmap generated yet.</h4>
                                        <p className="text-slate-400 mt-1 max-w-xs mx-auto text-xs">Click the button above to create your personalized AI-driven study plan.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <style>{`
                .custom-roadmap-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-roadmap-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-roadmap-scrollbar::-webkit-scrollbar-thumb {
                    background: #E2E8F0;
                    border-radius: 10px;
                }
                .custom-roadmap-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #CBD5E1;
                }
                
                .roadmap-markdown-container h2 {
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
                }
                
                .roadmap-markdown-container strong {
                    text-decoration: underline decoration-blue-200 decoration-4 underline-offset-2;
                }
            `}</style>
        </div>
    );
};

export default AnalyticsDashboard;
