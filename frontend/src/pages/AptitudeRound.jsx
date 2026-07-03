import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { 
    Award, 
    ArrowLeft, 
    CheckCircle, 
    XCircle,
    Clock, 
    Brain, 
    Target, 
    BarChart2,
    ChevronRight,
    Info,
    Check
} from 'lucide-react';
import logo from '../assets/Gemini_Generated_Image_ga5zozga5zozga5z.png';

const AptitudeRound = () => {
    const navigate = useNavigate();
    
    // Aptitude Round State
    const [aptitudeQuestions, setAptitudeQuestions] = useState([]);
    const [currentAptIndex, setCurrentAptIndex] = useState(0);
    const [aptitudeAnswers, setAptitudeAnswers] = useState([]);
    const [timeLeft, setTimeLeft] = useState(60);
    const [aptitudeStatus, setAptitudeStatus] = useState('not-started'); // 'not-started', 'loading', 'active', 'completed'
    const [aptitudeResults, setAptitudeResults] = useState(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [score, setScore] = useState(0);
    const timerRef = useRef(null);

    const fetchAptitudeQuestions = async () => {
        setAptitudeStatus('loading');
        try {
            const res = await api.get('/code/generate-aptitude');
            setAptitudeQuestions(res.data);
            setAptitudeStatus('active');
            setCurrentAptIndex(0);
            setTimeLeft(60);
            setAptitudeAnswers(new Array(res.data.length).fill(null));
            setScore(0);
            setShowFeedback(false);
        } catch (err) {
            console.error("Error fetching aptitude questions:", err);
            setAptitudeStatus('not-started');
            const detail = err.response?.data?.details || err.message;
            const displayError = typeof detail === 'object' ? JSON.stringify(detail) : detail;
            alert(`Failed to generate questions: ${displayError}. Please check your connection.`);
        }
    };

    const handleAptitudeAnswer = (optionIndex) => {
        if (showFeedback) return;
        const newAnswers = [...aptitudeAnswers];
        newAnswers[currentAptIndex] = optionIndex;
        setAptitudeAnswers(newAnswers);
    };

    const handleCheckAnswer = () => {
        const isCorrect = aptitudeAnswers[currentAptIndex] == aptitudeQuestions[currentAptIndex].correctAnswer;
        if (isCorrect) setScore(prev => prev + 1);
        setShowFeedback(true);
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const handleNextQuestion = () => {
        if (currentAptIndex < aptitudeQuestions.length - 1) {
            setCurrentAptIndex(prev => prev + 1);
            setTimeLeft(60);
            setShowFeedback(false);
        } else {
            completeAptitudeRound();
        }
    };

    const handleSkipQuestion = () => {
        const newAnswers = [...aptitudeAnswers];
        newAnswers[currentAptIndex] = 'skipped';
        setAptitudeAnswers(newAnswers);
        
        if (currentAptIndex < aptitudeQuestions.length - 1) {
            setCurrentAptIndex(prev => prev + 1);
            setTimeLeft(60);
            setShowFeedback(false);
        } else {
            completeAptitudeRound();
        }
    };

    const completeAptitudeRound = async () => {
        setAptitudeStatus('loading');
        try {
            const token = localStorage.getItem('token');
            
            // Calculate results
            const results = aptitudeQuestions.map((q, i) => ({
                ...q,
                userAnswer: aptitudeAnswers[i],
                isCorrect: aptitudeAnswers[i] !== 'skipped' && aptitudeAnswers[i] !== null && Number(aptitudeAnswers[i]) === Number(q.correctAnswer)
            }));

            const finalScore = results.filter(r => r.isCorrect).length;
            const topicsPerformance = {};
            
            results.forEach(r => {
                const topic = r.topic || "General Aptitude";
                if (!topicsPerformance[topic]) {
                    topicsPerformance[topic] = { total: 0, correct: 0 };
                }
                topicsPerformance[topic].total++;
                if (r.isCorrect) topicsPerformance[topic].correct++;
            });

            try {
                await api.post('/code/save-aptitude-result', {
                    results,
                    score: finalScore,
                    totalQuestions: aptitudeQuestions.length,
                    topicsPerformance
                });
            } catch (saveErr) {
                console.error("Failed to save results to backend, but showing summary anyway:", saveErr);
            }

            setAptitudeResults({
                score: finalScore,
                total: aptitudeQuestions.length,
                accuracy: aptitudeQuestions.length > 0 ? (finalScore / aptitudeQuestions.length) * 100 : 0,
                topicsPerformance,
                results
            });
            setAptitudeStatus('completed');
        } catch (err) {
            console.error("Error completing aptitude round:", err);
            setAptitudeStatus('active');
        }
    };

    useEffect(() => {
        if (aptitudeStatus === 'active' && timeLeft > 0 && !showFeedback) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && aptitudeStatus === 'active' && !showFeedback) {
            handleCheckAnswer(); // Auto-check if time runs out
        }

        return () => clearInterval(timerRef.current);
    }, [aptitudeStatus, timeLeft, currentAptIndex, showFeedback]);

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-[#E0E0E0] flex flex-col font-sans select-none overflow-x-hidden">
            {/* Navbar */}
            <nav className="h-14 md:h-16 bg-[#1A1A1A] border-b border-[#2A2A2A] px-4 md:px-8 flex justify-between items-center z-50 sticky top-0">
                <div className="flex items-center space-x-3 md:space-x-6">
                    <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
                        <img src={logo} alt="Logo" className="w-8 h-8 md:w-9 md:h-9 rounded-lg" />
                        <span className="text-lg md:text-xl font-bold tracking-tight hidden sm:inline">RProfile<span className="text-blue-500">.ai</span></span>
                    </div>
                </div>
                
                <div className="flex items-center space-x-4">
                    {aptitudeStatus === 'active' && (
                        <div className="flex items-center space-x-2 bg-blue-600/10 px-3 py-1 rounded-lg border border-blue-500/20">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-xs md:text-sm font-bold text-white">{score} / {aptitudeQuestions.length}</span>
                        </div>
                    )}
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="text-gray-400 hover:text-white transition font-bold text-xs md:text-sm flex items-center space-x-1 md:space-x-2 bg-[#2A2A2A] px-3 md:px-4 py-1.5 md:py-2 rounded-xl border border-[#3A3A3A]"
                    >
                        <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="hidden xs:inline">Exit</span>
                    </button>
                </div>
            </nav>

            <main className="flex-1 flex items-center justify-center p-4 md:p-6 overflow-hidden">
                <div className="w-full max-w-xl h-full flex flex-col justify-center">
                    {aptitudeStatus === 'not-started' && (
                        <div className="bg-[#141414] border border-[#2A2A2A] rounded-3xl p-8 md:p-10 text-center shadow-2xl animate-in fade-in zoom-in duration-500 max-w-lg mx-auto">
                            <div className="bg-blue-600/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-blue-600/5">
                                <Brain className="w-8 h-8 text-blue-500" />
                            </div>
                            <h1 className="text-2xl md:text-3xl font-black text-white mb-3">Aptitude Assessment</h1>
                            <p className="text-gray-400 text-xs md:text-sm mb-8 leading-relaxed">
                                Challenging MCQs curated from top engineering sources.
                            </p>
                            
                            <div className="grid grid-cols-2 gap-4 mb-8 text-left">
                                <div className="bg-[#1A1A1A] p-4 rounded-2xl border border-[#2A2A2A]">
                                    <Clock className="w-4 h-4 text-blue-500 mb-2" />
                                    <h4 className="font-bold text-white text-[10px] md:text-xs mb-1">Timed Round</h4>
                                    <p className="text-[8px] md:text-[10px] text-gray-500">60 seconds per question.</p>
                                </div>
                                <div className="bg-[#1A1A1A] p-4 rounded-2xl border border-[#2A2A2A]">
                                    <Target className="w-4 h-4 text-green-500 mb-2" />
                                    <h4 className="font-bold text-white text-[10px] md:text-xs mb-1">Live Results</h4>
                                    <p className="text-[8px] md:text-[10px] text-gray-500">Instant feedback & reasons.</p>
                                </div>
                            </div>

                            <button 
                                onClick={fetchAptitudeQuestions}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 md:py-4 rounded-2xl font-black text-sm md:text-base transition shadow-xl shadow-blue-900/20 flex items-center justify-center space-x-3 group"
                            >
                                <span>Start Assessment</span>
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                            </button>
                        </div>
                    )}

                    {aptitudeStatus === 'loading' && (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="relative mb-6">
                                <div className="animate-spin rounded-full h-12 w-12 md:h-16 md:w-16 border-b-2 border-blue-500"></div>
                                <Brain className="w-4 h-4 md:w-6 md:h-6 text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                            </div>
                            <h2 className="text-lg md:text-xl font-bold text-white mb-2">
                                {aptitudeQuestions.length > 0 ? "Analyzing Results" : "Generating Questions"}
                            </h2>
                            <p className="text-xs text-gray-500 animate-pulse text-center">
                                {aptitudeQuestions.length > 0 ? "Finalizing your performance report..." : "Sourcing GeeksforGeeks level technical problems..."}
                            </p>
                        </div>
                    )}

                    {aptitudeStatus === 'active' && aptitudeQuestions.length > 0 && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col">
                            <div className="flex justify-between items-center mb-3 md:mb-4 px-2">
                                <div className="flex items-center space-x-2">
                                    <span className="text-[10px] md:text-xs font-black text-gray-500 uppercase tracking-widest">Q{currentAptIndex + 1} of {aptitudeQuestions.length}</span>
                                    <div className="h-1 w-20 md:w-32 bg-[#1A1A1A] rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-blue-500 transition-all duration-500"
                                            style={{ width: `${((currentAptIndex + 1) / aptitudeQuestions.length) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg border transition-all ${timeLeft < 15 ? 'border-red-500/50 text-red-500' : 'border-[#2A2A2A] text-blue-400'}`}>
                                    <Clock className="w-3 h-3" />
                                    <span className="text-xs md:text-sm font-mono font-black">{timeLeft}s</span>
                                </div>
                            </div>

                            <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-6 md:p-8 shadow-2xl flex flex-col space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
                                <div className="space-y-2">
                                    <span className="text-[8px] md:text-[10px] uppercase font-black px-2 py-0.5 rounded bg-blue-600/10 text-blue-500 border border-blue-600/20 inline-block tracking-[0.2em]">
                                        {aptitudeQuestions[currentAptIndex].topic}
                                    </span>
                                    <h3 className="text-base md:text-lg font-bold text-white leading-relaxed">
                                        {aptitudeQuestions[currentAptIndex].question}
                                    </h3>
                                </div>

                                <div className="space-y-2 md:space-y-3">
                                    {aptitudeQuestions[currentAptIndex].options.map((option, idx) => {
                                        let borderClass = 'border-[#2A2A2A] bg-[#1A1A1A] hover:border-[#3A3A3A]';
                                        let textClass = 'text-gray-500';
                                        
                                        if (showFeedback) {
                                            const isThisCorrect = Number(idx) === Number(aptitudeQuestions[currentAptIndex].correctAnswer);
                                            const isThisSelected = Number(aptitudeAnswers[currentAptIndex]) === Number(idx);
                                            
                                            if (isThisCorrect) {
                                                borderClass = 'border-green-500 bg-green-500/10 shadow-[0_0_15px_rgba(34,197,94,0.1)]';
                                                textClass = 'text-green-400 font-bold';
                                            } else if (isThisSelected) {
                                                borderClass = 'border-red-500 bg-red-500/10';
                                                textClass = 'text-red-400 font-bold';
                                            }
                                        } else if (aptitudeAnswers[currentAptIndex] === idx) {
                                            borderClass = 'border-blue-500 bg-blue-500/5 ring-1 ring-blue-500/30';
                                            textClass = 'text-white font-bold';
                                        }

                                        return (
                                            <label 
                                                key={idx}
                                                className={`group flex items-center p-3 md:p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${borderClass}`}
                                            >
                                                <input 
                                                    type="radio"
                                                    name={`question-${currentAptIndex}`}
                                                    className="hidden"
                                                    checked={aptitudeAnswers[currentAptIndex] === idx}
                                                    onChange={() => handleAptitudeAnswer(idx)}
                                                    disabled={showFeedback}
                                                />
                                                <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center transition-all ${aptitudeAnswers[currentAptIndex] === idx ? (showFeedback ? (idx === aptitudeQuestions[currentAptIndex].correctAnswer ? 'border-green-500' : 'border-red-500') : 'border-blue-500 scale-110') : 'border-gray-700'}`}>
                                                    {aptitudeAnswers[currentAptIndex] === idx && (
                                                        <div className={`w-2 h-2 rounded-full ${showFeedback ? (idx === aptitudeQuestions[currentAptIndex].correctAnswer ? 'bg-green-500' : 'bg-red-500') : 'bg-blue-500'}`} />
                                                    )}
                                                </div>
                                                <span className="text-xs md:text-sm">{option}</span>
                                            </label>
                                        );
                                    })}
                                </div>

                                {showFeedback && (
                                    <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 animate-in fade-in slide-in-from-top-2">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <Info className="w-3 h-3 text-blue-400" />
                                            <span className="text-[8px] md:text-[10px] font-bold text-blue-400 uppercase tracking-widest">Reasoning / Solution</span>
                                        </div>
                                        <p className="text-[10px] md:text-xs text-gray-400 leading-relaxed italic">
                                            {aptitudeQuestions[currentAptIndex].explanation}
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3 md:gap-4 pt-2">
                                    {!showFeedback ? (
                                        <>
                                            <button 
                                                onClick={handleSkipQuestion}
                                                className="bg-[#2A2A2A] hover:bg-[#333] text-gray-400 hover:text-white py-3 md:py-4 rounded-xl font-black text-xs md:text-sm transition-all border border-[#3A3A3A] flex items-center justify-center space-x-2"
                                            >
                                                <span>Skip</span>
                                            </button>
                                            <button 
                                                onClick={handleCheckAnswer}
                                                disabled={aptitudeAnswers[currentAptIndex] === null}
                                                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 md:py-4 rounded-xl font-black text-xs md:text-sm transition-all shadow-lg flex items-center justify-center space-x-2"
                                            >
                                                <span>Check</span>
                                                <Check className="w-3 h-3 md:w-4 md:h-4" />
                                            </button>
                                        </>
                                    ) : (
                                        <button 
                                            onClick={handleNextQuestion}
                                            className="col-span-2 bg-green-600 hover:bg-green-500 text-white py-3 md:py-4 rounded-xl font-black text-xs md:text-sm transition-all shadow-lg flex items-center justify-center space-x-2"
                                        >
                                            <span>{currentAptIndex === aptitudeQuestions.length - 1 ? "Finish Round" : "Next Question"}</span>
                                            <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {aptitudeStatus === 'completed' && aptitudeResults && (
                        <div className="animate-in fade-in zoom-in duration-500 max-h-[90vh] overflow-y-auto pr-1 custom-scrollbar">
                            <div className="bg-[#141414] border border-[#2A2A2A] rounded-3xl p-8 md:p-10 shadow-2xl text-center">
                                <div className="bg-green-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Award className="w-8 h-8 text-green-500" />
                                </div>
                                <h1 className="text-2xl md:text-3xl font-black text-white mb-2">Round Summary</h1>
                                <p className="text-gray-500 mb-8 text-xs">Performance analysis based on your responses.</p>

                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="bg-[#1A1A1A] p-5 rounded-2xl border border-[#2A2A2A]">
                                        <p className="text-[8px] md:text-[10px] font-bold text-gray-500 uppercase mb-1">Final Score</p>
                                        <div className="flex items-center justify-center space-x-1">
                                            <span className="text-2xl md:text-3xl font-black text-blue-500">{aptitudeResults.score}</span>
                                            <span className="text-xs text-gray-700">/ {aptitudeResults.total}</span>
                                        </div>
                                    </div>
                                    <div className="bg-[#1A1A1A] p-5 rounded-2xl border border-[#2A2A2A]">
                                        <p className="text-[8px] md:text-[10px] font-bold text-gray-500 uppercase mb-1">Accuracy</p>
                                        <span className="text-2xl md:text-3xl font-black text-green-500">{(aptitudeResults.accuracy || 0).toFixed(0)}%</span>
                                    </div>
                                </div>

                                <div className="text-left mb-8">
                                    <h4 className="text-[8px] md:text-[10px] font-black text-gray-500 uppercase mb-4 flex items-center">
                                        <BarChart2 className="w-3 h-3 mr-2" /> Performance Matrix
                                    </h4>
                                    <div className="space-y-3">
                                        {Object.keys(aptitudeResults.topicsPerformance || {}).map(topic => {
                                            const perf = aptitudeResults.topicsPerformance[topic];
                                            const perc = perf.total > 0 ? (perf.correct / perf.total) * 100 : 0;
                                            return (
                                                <div key={topic} className="bg-[#1A1A1A] p-4 rounded-xl border border-[#2A2A2A]">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-[10px] md:text-xs font-bold text-white">{topic}</span>
                                                        <span className={`text-[8px] md:text-[10px] font-black px-2 py-0.5 rounded-full ${perc >= 80 ? 'bg-green-500/10 text-green-500' : perc >= 50 ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'}`}>
                                                            {perc.toFixed(0)}%
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-[#0A0A0A] h-1.5 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-full transition-all duration-1000 ${perc >= 80 ? 'bg-green-500' : perc >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                            style={{ width: `${perc}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="flex space-x-3">
                                    <button 
                                        onClick={() => setAptitudeStatus('not-started')}
                                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-black text-xs transition shadow-xl"
                                    >
                                        Try Again
                                    </button>
                                    <button 
                                        onClick={() => navigate('/dashboard')}
                                        className="flex-1 bg-[#2A2A2A] hover:bg-[#333] text-white py-3 rounded-xl font-black text-xs transition border border-[#3A3A3A]"
                                    >
                                        Dashboard
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 3px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #2A2A2A; border-radius: 10px; }
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes zoom-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .animate-in { animation-duration: 0.5s; animation-fill-mode: both; }
                .fade-in { animation-name: fade-in; }
                .zoom-in { animation-name: zoom-in; }
                .slide-in-from-bottom-4 { animation-name: slide-up; }
            `}</style>
        </div>
    );
};

export default AptitudeRound;
