import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
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
                const token = localStorage.getItem('token');
                const [analyticsRes, codingRes] = await Promise.all([
                    axios.get('http://127.0.0.1:5000/api/analytics/user', {
                        headers: { 'x-auth-token': token }
                    }),
                    axios.get('http://127.0.0.1:5000/api/analytics/coding-stats', {
                        headers: { 'x-auth-token': token }
                    })
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
            const token = localStorage.getItem('token');
            const res = await axios.get('http://127.0.0.1:5000/api/analytics/roadmap', {
                headers: { 'x-auth-token': token }
            });
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
        <div className="min-h-screen bg-[#F8FAFC] text-gray-800 font-sans pb-20">
            <nav className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
                    <div className="bg-[#1E3A8A] p-2 rounded-lg">
                        <Award className="text-white w-6 h-6" />
                    </div>
                    <span className="text-2xl font-black text-[#1E3A8A]">ResumePro<span className="text-blue-500">.ai</span></span>
                </div>
                <button onClick={() => navigate('/dashboard')} className="flex items-center space-x-2 text-gray-500 hover:text-[#1E3A8A] font-medium transition">
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back to Dashboard</span>
                </button>
            </nav>

            <main className="container mx-auto px-6 py-10 max-w-7xl">
                <header className="mb-10">
                    <h1 className="text-4xl font-black text-gray-900 mb-2">Performance Analytics</h1>
                    <p className="text-gray-500">Track your growth and identify areas for improvement.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <div className="bg-blue-50 p-3 rounded-2xl w-fit mb-4">
                            <TrendingUp className="text-blue-600 w-6 h-6" />
                        </div>
                        <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">Avg. Accuracy</h3>
                        <div className="text-3xl font-black text-gray-900">{data?.metrics.avgAccuracy}/10</div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <div className="bg-green-50 p-3 rounded-2xl w-fit mb-4">
                            <Zap className="text-green-600 w-6 h-6" />
                        </div>
                        <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">Consistency</h3>
                        <div className="text-3xl font-black text-gray-900">{data?.metrics.consistency}%</div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <div className="bg-purple-50 p-3 rounded-2xl w-fit mb-4">
                            <Target className="text-purple-600 w-6 h-6" />
                        </div>
                        <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">Strong Areas</h3>
                        <div className="text-3xl font-black text-gray-900">{data?.strongTopics.length}</div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <div className="bg-red-50 p-3 rounded-2xl w-fit mb-4">
                            <BrainCircuit className="text-red-600 w-6 h-6" />
                        </div>
                        <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">Weak Areas</h3>
                        <div className="text-3xl font-black text-gray-900">{data?.weakTopics.length}</div>
                    </div>
                </div>

                {/* Coding Progress Section */}
                <div className="mb-10">
                    <h2 className="text-2xl font-bold mb-6 flex items-center">
                        <Terminal className="mr-3 text-blue-600 w-6 h-6" /> Coding Proficiency
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-[#1E293B] text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden group border border-white/10">
                            <div className="relative z-10">
                                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Total Solved</h3>
                                <div className="text-5xl font-black tracking-tight">{codingStats?.totalSolved || 0}</div>
                            </div>
                            <Award className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5 group-hover:text-blue-500/10 transition-colors" />
                        </div>
                        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm transition-all hover:shadow-md">
                            <h3 className="text-green-600 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Easy</h3>
                            <div className="text-4xl font-black text-gray-900">{codingStats?.easy || 0}</div>
                            <div className="w-full bg-gray-100 h-2 rounded-full mt-4 overflow-hidden">
                                <div 
                                    className="bg-green-500 h-full rounded-full transition-all duration-1000 ease-out" 
                                    style={{ width: `${codingStats?.totalSolved ? (codingStats.easy / codingStats.totalSolved) * 100 : 0}%` }}
                                ></div>
                            </div>
                        </div>
                        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm transition-all hover:shadow-md">
                            <h3 className="text-yellow-600 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Medium</h3>
                            <div className="text-4xl font-black text-gray-900">{codingStats?.medium || 0}</div>
                            <div className="w-full bg-gray-100 h-2 rounded-full mt-4 overflow-hidden">
                                <div 
                                    className="bg-yellow-500 h-full rounded-full transition-all duration-1000 ease-out" 
                                    style={{ width: `${codingStats?.totalSolved ? (codingStats.medium / codingStats.totalSolved) * 100 : 0}%` }}
                                ></div>
                            </div>
                        </div>
                        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm transition-all hover:shadow-md">
                            <h3 className="text-red-600 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Hard</h3>
                            <div className="text-4xl font-black text-gray-900">{codingStats?.hard || 0}</div>
                            <div className="w-full bg-gray-100 h-2 rounded-full mt-4 overflow-hidden">
                                <div 
                                    className="bg-red-500 h-full rounded-full transition-all duration-1000 ease-out" 
                                    style={{ width: `${codingStats?.totalSolved ? (codingStats.hard / codingStats.totalSolved) * 100 : 0}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-8 mb-10">
                    {/* Score Trend */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                        <h3 className="text-xl font-bold mb-6">Interview Score Trend</h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data?.scoreTrends}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                    <XAxis dataKey="date" tickFormatter={(str) => new Date(str).toLocaleDateString()} />
                                    <YAxis domain={[0, 10]} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="avgScore" stroke="#1E3A8A" strokeWidth={4} dot={{ r: 6, fill: '#1E3A8A' }} activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Topic Mastery */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                        <h3 className="text-xl font-bold mb-6">Topic Mastery</h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                    <PolarGrid stroke="#E2E8F0" />
                                    <PolarAngleAxis dataKey="topic" />
                                    <PolarRadiusAxis angle={30} domain={[0, 10]} />
                                    <Radar name="Score" dataKey="score" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Recent Solutions & Roadmap */}
                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1">
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-[600px] flex flex-col">
                            <h3 className="text-xl font-bold mb-6 flex items-center shrink-0">
                                <RefreshCcw className="mr-2 text-gray-400 w-5 h-5" /> Recent Solved
                            </h3>
                            <div className="flex-1 overflow-y-auto custom-roadmap-scrollbar space-y-4 pr-2">
                                {codingStats?.recentSolved?.length > 0 ? codingStats.recentSolved.map((prob, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100 transition hover:border-blue-200">
                                        <div>
                                            <div className="font-bold text-gray-900 text-sm">{prob.title}</div>
                                            <div className="text-[10px] text-gray-400 uppercase font-black">{new Date(prob.solvedAt).toLocaleDateString()}</div>
                                        </div>
                                        <span className={`text-[10px] font-black px-2 py-1 rounded ${
                                            prob.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                                            prob.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {prob.difficulty}
                                        </span>
                                    </div>
                                )) : (
                                    <p className="text-gray-400 text-sm italic text-center mt-10">No problems solved yet.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        {/* Personalized Roadmap */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden h-[600px] flex flex-col">
                            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                                <div>
                                    <h3 className="text-2xl font-bold flex items-center">
                                        <BookOpen className="mr-3 text-blue-600" /> AI Study Roadmap
                                    </h3>
                                    <p className="text-gray-500 mt-1">Personalized 7-day plan to tackle weak areas.</p>
                                </div>
                                <div className="flex space-x-4">
                                    {roadmap && (
                                        <button 
                                            onClick={downloadPDF}
                                            disabled={isDownloading}
                                            className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl font-bold hover:bg-gray-50 transition disabled:opacity-50 flex items-center shadow-sm text-sm"
                                        >
                                            {isDownloading ? <RefreshCcw className="animate-spin mr-2 w-4 h-4" /> : <Download className="mr-2 w-4 h-4" />}
                                            PDF
                                        </button>
                                    )}
                                    <button 
                                        onClick={fetchRoadmap}
                                        disabled={loadingRoadmap}
                                        className="bg-[#1E3A8A] text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-800 transition disabled:opacity-50 flex items-center shadow-lg shadow-blue-100 text-sm"
                                    >
                                        {loadingRoadmap ? <RefreshCcw className="animate-spin mr-2 w-4 h-4" /> : <Zap className="mr-2 w-4 h-4" />}
                                        {roadmap ? "Regenerate" : "Generate"}
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-8 custom-roadmap-scrollbar relative">
                                {errorMsg && (
                                    <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold mb-6 border border-red-100 text-center">
                                        {errorMsg}
                                    </div>
                                )}
                                {roadmap ? (
                                    <div ref={roadmapRef} className="bg-white p-1 rounded-xl roadmap-markdown-container">
                                        <div className="flex items-center space-x-3 mb-10 pb-6 border-b border-gray-100">
                                            <div className="bg-[#1E3A8A] p-2.5 rounded-xl">
                                                <Award className="text-white w-6 h-6" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-black text-[#1E3A8A]">Elite Preparation Roadmap</h2>
                                                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em]">Personalized 7-Day Plan</p>
                                            </div>
                                        </div>
                                        <div className="prose prose-blue max-w-none 
                                            prose-headings:text-[#1E3A8A] prose-headings:font-black 
                                            prose-h1:text-3xl prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-6
                                            prose-h2:bg-blue-50 prose-h2:p-4 prose-h2:rounded-2xl prose-h2:border-l-4 prose-h2:border-blue-600
                                            prose-p:text-gray-600 prose-p:leading-relaxed prose-p:font-medium
                                            prose-li:text-gray-600 prose-li:font-medium
                                            prose-strong:text-[#1E3A8A] prose-strong:font-black
                                            prose-em:text-blue-600 prose-em:italic prose-em:font-bold">
                                            <ReactMarkdown>{roadmap}</ReactMarkdown>
                                        </div>
                                        <div className="mt-16 pt-8 border-t border-gray-100 text-center">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">© 2026 RProfile.ai • Your Path to the Elite 1%</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-20 h-full flex flex-col justify-center items-center">
                                        <div className="bg-blue-50 p-6 rounded-full w-fit mb-6">
                                            <BookOpen className="text-blue-200 w-12 h-12" />
                                        </div>
                                        <h4 className="text-xl font-bold text-gray-400">No roadmap generated yet.</h4>
                                        <p className="text-gray-400 mt-2 max-w-xs mx-auto">Click the button above to create your personalized AI-driven study plan.</p>
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
