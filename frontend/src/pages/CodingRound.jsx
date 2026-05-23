import React, { useState, useEffect, useRef } from 'react';
import Editor from "@monaco-editor/react";
import api from '../api';
import logo from '../assets/Gemini_Generated_Image_ga5zozga5zozga5z.png';
import { 
    Play, 
    Send, 
    Award, 
    ArrowLeft, 
    Terminal, 
    Cpu, 
    Info, 
    ChevronUp, 
    ChevronDown, 
    ListCheck, 
    BookOpen, 
    Search, 
    CheckCircle, 
    XCircle 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CodingRound = () => {
    const navigate = useNavigate();
    
    const [currentProblem, setCurrentProblem] = useState(null);
    const [code, setCode] = useState("");
    const [language, setLanguage] = useState("javascript");
    const [output, setOutput] = useState("");
    const [evaluation, setEvaluation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [evaluating, setEvaluating] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [terminalHeight, setTerminalHeight] = useState(250);
    const [sidebarWidth, setSidebarWidth] = useState(450);
    const [isResizingTerminal, setIsResizingTerminal] = useState(false);
    const [isResizingSidebar, setIsResizingSidebar] = useState(false);
    const [activeTab, setActiveTab] = useState('description');
    const [searchQuery, setSearchQuery] = useState("");

    const terminalRef = useRef(null);
    const sidebarRef = useRef(null);

    const fetchProblem = async (query = "") => {
        setFetching(true);
        try {
            const url = query 
                ? `/code/generate-problem?query=${encodeURIComponent(query)}`
                : '/code/generate-problem';
            const res = await api.get(url);
            setCurrentProblem(res.data);
            setCode(res.data.defaultCode[language] || res.data.defaultCode['javascript'] || "");
            setEvaluation(null);
            setOutput("");
            setActiveTab('description');
        } catch (err) {
            console.error("Error fetching problem:", err);
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        fetchProblem();
    }, []);

    useEffect(() => {
        if (currentProblem) {
            setCode(currentProblem.defaultCode[language] || "");
        }
    }, [language, currentProblem]);

    const handleRunTests = async () => {
        setLoading(true);
        setEvaluation(null);
        try {
            const res = await api.post('/code/evaluate', {
                problem: currentProblem,
                code,
                language,
                isSubmit: false
            });
            setEvaluation(res.data);
            setOutput(res.data.correctness);
        } catch (err) {
            setOutput("Error running tests: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitCode = async () => {
        setEvaluating(true);
        try {
            const res = await api.post('/code/evaluate', {
                problem: currentProblem,
                code,
                language,
                isSubmit: true
            });
            setEvaluation(res.data);
            if (res.data.passedAll) {
                setOutput("✅ Submission Successful! All 15+ test cases passed.");
                setActiveTab('submissions');
            } else {
                setOutput("❌ Submission Failed. Some test cases did not pass. Check the details below.");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setEvaluating(false);
        }
    };

    const handleSearch = (e) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            fetchProblem(searchQuery);
            setSearchQuery("");
        }
    };

    const startResizingTerminal = (e) => {
        setIsResizingTerminal(true);
        document.addEventListener('mousemove', handleMouseMoveTerminal);
        document.addEventListener('mouseup', stopResizing);
    };

    const startResizingSidebar = (e) => {
        setIsResizingSidebar(true);
        document.addEventListener('mousemove', handleMouseMoveSidebar);
        document.addEventListener('mouseup', stopResizing);
    };

    const stopResizing = () => {
        setIsResizingTerminal(false);
        setIsResizingSidebar(false);
        document.removeEventListener('mousemove', handleMouseMoveTerminal);
        document.removeEventListener('mousemove', handleMouseMoveSidebar);
        document.removeEventListener('mouseup', stopResizing);
    };

    const handleMouseMoveTerminal = (e) => {
        const newHeight = window.innerHeight - e.clientY;
        if (newHeight > 100 && newHeight < window.innerHeight * 0.8) {
            setTerminalHeight(newHeight);
        }
    };

    const handleMouseMoveSidebar = (e) => {
        const newWidth = e.clientX;
        if (newWidth > 300 && newWidth < window.innerWidth * 0.7) {
            setSidebarWidth(newWidth);
        }
    };

    if (fetching && !currentProblem) {
        return (
            <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                    <p className="text-xl font-bold tracking-tight">AI is preparing your challenge...</p>
                </div>
            </div>
        );
    }

    if (!currentProblem) return null;

    return (
        <div className="h-screen bg-[#0A0A0A] text-[#E0E0E0] flex flex-col overflow-hidden font-sans select-none">
            {/* Navbar */}
            <nav className="h-14 bg-[#1A1A1A] border-b border-[#2A2A2A] px-6 flex justify-between items-center z-50">
                <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
                        <img src={logo} alt="RProfile.ai Logo" className="w-8 h-8 rounded-lg" />
                        <span className="text-lg font-bold tracking-tight">RProfile<span className="text-blue-500">.ai</span></span>
                    </div>
                    
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-500 transition" />
                        <input 
                            type="text"
                            placeholder="Search concept or question (e.g. 'Binary Search')"
                            className="bg-[#2A2A2A] border border-[#3A3A3A] rounded-full py-1.5 pl-10 pr-4 text-xs w-64 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition text-gray-200"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleSearch}
                        />
                    </div>
                </div>
                
                <div className="flex items-center space-x-4">
                    <button 
                        onClick={() => fetchProblem()}
                        disabled={fetching}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-md text-xs font-bold transition flex items-center shadow-lg shadow-blue-900/10"
                    >
                        {fetching ? "Fetching..." : "Next Challenge"}
                    </button>
                    <div className="h-4 w-[1px] bg-[#333]"></div>
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="text-gray-400 hover:text-white transition font-bold text-sm flex items-center space-x-1"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Exit</span>
                    </button>
                </div>
            </nav>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel: Problem Description */}
                <div 
                    style={{ width: `${sidebarWidth}px` }}
                    className="bg-[#0A0A0A] border-r border-[#2A2A2A] flex flex-col overflow-hidden"
                >
                    <div className="flex items-center space-x-4 px-6 py-3 border-b border-[#2A2A2A] bg-[#141414]">
                        <button 
                            onClick={() => setActiveTab('description')}
                            className={`text-xs font-bold pb-3 -mb-3.5 transition ${activeTab === 'description' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Description
                        </button>
                        <button 
                            onClick={() => setActiveTab('submissions')}
                            className={`text-xs font-bold pb-3 -mb-3.5 transition ${activeTab === 'submissions' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Submissions
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar select-text">
                        {activeTab === 'description' ? (
                            <div className="animate-in fade-in duration-300">
                                <div className="mb-6">
                                    <h2 className="text-2xl font-bold mb-2">{currentProblem.title}</h2>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-green-500/10 text-green-500">Medium</span>
                                        <span className="text-xs text-gray-500">Problem ID: AI-{currentProblem.title.length}</span>
                                    </div>
                                </div>

                                <div className="prose prose-invert max-w-none text-gray-300 text-sm leading-relaxed mb-8">
                                    <p className="mb-6 whitespace-pre-wrap">{currentProblem.description}</p>
                                    
                                    <h3 className="text-white text-base font-bold mb-3 flex items-center">
                                        <Info className="w-4 h-4 mr-2 text-blue-500" /> Examples
                                    </h3>
                                    <pre className="bg-[#141414] p-4 rounded-lg border border-[#2A2A2A] text-xs font-mono text-blue-300 whitespace-pre-wrap mb-6 shadow-inner">
                                        {currentProblem.example}
                                    </pre>

                                    <h3 className="text-white text-base font-bold mb-3 flex items-center">
                                        <Cpu className="w-4 h-4 mr-2 text-yellow-500" /> Constraints
                                    </h3>
                                    <ul className="list-disc pl-5 space-y-2 text-gray-400 text-xs">
                                        {currentProblem.constraints?.map((c, i) => (
                                            <li key={i}>{c}</li>
                                        )) || (
                                            <li>Standard constraints apply for this challenge level.</li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        ) : (
                            <div className="animate-in fade-in duration-300 h-full">
                                {evaluation && evaluation.passedAll ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center py-10">
                                        <CheckCircle className="w-16 h-16 text-green-500 mb-6" />
                                        <h3 className="text-2xl font-bold text-white mb-2">Success!</h3>
                                        <p className="text-gray-400 text-sm mb-8 px-10">Your solution passed all 15+ test cases with optimal performance.</p>
                                        
                                        <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-8">
                                            <div className="bg-[#141414] p-4 rounded-2xl border border-[#2A2A2A]">
                                                <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Time</span>
                                                <span className="text-sm font-mono text-green-400">{evaluation.complexity.split(',')[0]}</span>
                                            </div>
                                            <div className="bg-[#141414] p-4 rounded-2xl border border-[#2A2A2A]">
                                                <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Space</span>
                                                <span className="text-sm font-mono text-green-400">{evaluation.complexity.split(',')[1]}</span>
                                            </div>
                                        </div>

                                        <button 
                                            onClick={() => fetchProblem()}
                                            className="w-full max-w-sm bg-[#2A2A2A] hover:bg-[#333] text-white py-4 rounded-2xl font-bold text-sm transition"
                                        >
                                            Next Question
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-center py-10">
                                        <BookOpen className="w-16 h-16 text-gray-700 mb-6" />
                                        <h3 className="text-lg font-bold text-gray-500 mb-2">No Submissions Yet</h3>
                                        <p className="text-gray-600 text-xs px-10">Submit your code to see the evaluation and test case results here.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Resize Handle */}
                <div 
                    className="w-1 bg-[#1A1A1A] hover:bg-blue-600 transition cursor-col-resize z-20"
                    onMouseDown={startResizingSidebar}
                ></div>

                {/* Right Panel: Editor & Terminal */}
                <div className="flex-1 flex flex-col bg-[#0A0A0A] overflow-hidden">
                    {/* Editor Header */}
                    <div className="h-10 bg-[#1A1A1A] border-b border-[#2A2A2A] flex justify-between items-center px-4">
                        <div className="flex items-center space-x-2">
                            <select 
                                className="bg-transparent text-xs font-bold text-gray-300 outline-none cursor-pointer hover:text-white"
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                            >
                                <option value="javascript">JavaScript</option>
                                <option value="python">Python</option>
                                <option value="cpp">C++</option>
                                <option value="java">Java</option>
                            </select>
                        </div>
                    </div>

                    {/* Editor Area */}
                    <div className="flex-1 relative overflow-hidden">
                        <Editor
                            height="100%"
                            theme="vs-dark"
                            language={language === 'cpp' ? 'cpp' : language}
                            value={code}
                            onChange={(val) => setCode(val)}
                            options={{
                                fontSize: 14,
                                minimap: { enabled: false },
                                padding: { top: 20, bottom: 20 },
                                fontFamily: "'Fira Code', 'Cascadia Code', monospace",
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                scrollbar: {
                                    vertical: 'visible',
                                    horizontal: 'visible',
                                    useShadows: false,
                                    verticalScrollbarSize: 10,
                                    horizontalScrollbarSize: 10
                                },
                                renderLineHighlight: 'all',
                                lineNumbers: 'on',
                                overviewRulerBorder: false,
                                hideCursorInOverviewRuler: true
                            }}
                        />
                    </div>

                    {/* Terminal Resize Handle */}
                    <div 
                        className="h-1 bg-[#1A1A1A] hover:bg-blue-600 transition cursor-ns-resize z-10"
                        onMouseDown={startResizingTerminal}
                    ></div>

                    {/* Terminal Area */}
                    <div 
                        ref={terminalRef}
                        style={{ height: `${terminalHeight}px` }}
                        className="bg-[#0A0A0A] border-t border-[#2A2A2A] flex flex-col overflow-hidden"
                    >
                        <div className="h-10 bg-[#141414] border-b border-[#2A2A2A] flex justify-between items-center px-6">
                            <div className="flex items-center space-x-4">
                                <button className="text-xs font-bold text-blue-500 border-b-2 border-blue-500 pb-3 -mb-3.5">Console</button>
                            </div>
                            <div className="flex space-x-3">
                                <button 
                                    onClick={handleRunTests}
                                    disabled={loading || evaluating}
                                    className="px-4 py-1.5 rounded bg-[#2A2A2A] hover:bg-[#333] text-gray-300 text-xs font-bold border border-[#3A3A3A] transition disabled:opacity-50 flex items-center"
                                >
                                    {loading ? <div className="animate-spin h-3 w-3 border-b-2 border-white mr-2"></div> : <Play className="w-3 h-3 mr-2" />}
                                    Run
                                </button>
                                <button 
                                    onClick={handleSubmitCode}
                                    disabled={loading || evaluating}
                                    className="px-4 py-1.5 rounded bg-green-600 hover:bg-green-500 text-white text-xs font-bold transition disabled:opacity-50 flex items-center shadow-lg"
                                >
                                    {evaluating ? <div className="animate-spin h-3 w-3 border-b-2 border-white mr-2"></div> : <Send className="w-3 h-3 mr-2" />}
                                    Submit
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto p-6 font-mono text-sm leading-relaxed custom-scrollbar select-text">
                            {output ? (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className={`p-4 rounded-lg mb-4 flex items-start space-x-3 ${output.includes('✅') || (evaluation && evaluation.passedAll) ? 'bg-green-900/10 border border-green-900/20' : 'bg-red-900/10 border border-red-900/20'}`}>
                                        {output.includes('✅') || (evaluation && evaluation.passedAll) ? <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" /> : <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
                                        <pre className={`whitespace-pre-wrap text-xs ${output.includes('✅') || (evaluation && evaluation.passedAll) ? 'text-green-400' : 'text-red-400'}`}>
                                            {output}
                                        </pre>
                                    </div>
                                    
                                    {evaluation && (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center bg-[#141414] p-4 rounded-xl border border-[#2A2A2A]">
                                                <div>
                                                    <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Complexity Analysis</span>
                                                    <span className="text-xs text-gray-300 font-mono">{evaluation.complexity}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Score</span>
                                                    <span className={`text-xl font-bold ${evaluation.score >= 7 ? 'text-green-500' : 'text-yellow-500'}`}>{evaluation.score}/10</span>
                                                </div>
                                            </div>
                                            
                                            {evaluation.improvements?.length > 0 && !evaluation.passedAll && (
                                                <div className="bg-yellow-900/5 border border-yellow-900/10 p-4 rounded-xl">
                                                    <span className="text-[10px] uppercase font-bold text-yellow-600 block mb-2 tracking-widest">Feedback</span>
                                                    <ul className="list-disc pl-4 space-y-1">
                                                        {evaluation.improvements.map((imp, i) => (
                                                            <li key={i} className="text-[11px] text-gray-400">{imp}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-gray-600 italic text-xs">
                                    // Submit your code to see detailed analysis and test case results...
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #2A2A2A;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #333;
                }
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-in {
                    animation: fade-in 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default CodingRound;
