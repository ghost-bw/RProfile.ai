import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { Send, MessageSquare, Mic, MicOff, ChevronLeft, Volume2, VolumeX } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const Interview = () => {
    const { sessionId } = useParams();
    const [session, setSession] = useState(null);
    const [answer, setAnswer] = useState('');
    const [chat, setChat] = useState([]);
    const [evaluating, setEvaluating] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState(null);
    const [timer, setTimer] = useState(0);
    const [timerActive, setTimerActive] = useState(false);
    const [ttsEnabled, setTtsEnabled] = useState(true);
    const navigate = useNavigate();
    const recognitionRef = useRef(null);
    const timerIntervalRef = useRef(null);
    const chatEndRef = useRef(null);
    const ttsEnabledRef = useRef(ttsEnabled);
    const audioRef = useRef(null);
    const lastSpokenTextRef = useRef('');
    const lastSpokenAtRef = useRef(0);

    useEffect(() => {
        ttsEnabledRef.current = ttsEnabled;
    }, [ttsEnabled]);

    const stopAllSpeech = () => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }
    };

    // Warm up speech synthesis voices on mount
    useEffect(() => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.getVoices();
        }
        return () => {
            stopAllSpeech();
        };
    }, []);

    // Scroll to bottom when chat updates
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chat]);

    const speak = async (text, cancelExisting = true) => {
        if (!ttsEnabledRef.current || !text) return;

        const cleanText = text
            .replace(/\*\*Suggestions:\*\*/g, 'Suggestions:')
            .replace(/[\#\*\_`~\[\]\(\)\-\+\>\!]/g, '')
            .replace(/\n+/g, ' ')
            .trim();

        if (!cleanText) return;

        const now = Date.now();
        if (cleanText === lastSpokenTextRef.current && now - lastSpokenAtRef.current < 2000) {
            return;
        }

        if (cancelExisting) {
            stopAllSpeech();
        }

        lastSpokenTextRef.current = cleanText;
        lastSpokenAtRef.current = now;

        try {
            const res = await api.post('/interview/tts', { text: cleanText }, { responseType: 'blob' });
            const audioUrl = URL.createObjectURL(res.data);
            const audio = new Audio(audioUrl);
            audioRef.current = audio;

            audio.onended = () => {
                if (audioRef.current === audio) {
                    audioRef.current = null;
                }
                URL.revokeObjectURL(audioUrl);
            };

            await audio.play();
        } catch (err) {
            console.log('Neural TTS not configured or failed, falling back to browser voice.');
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(cleanText);
                utterance.lang = 'en-US';

                const voices = window.speechSynthesis.getVoices();
                const voice = voices.find(v =>
                    v.lang.startsWith('en') &&
                    (v.name.toLowerCase().includes('natural') ||
                     v.name.toLowerCase().includes('online') ||
                     v.name.toLowerCase().includes('google') ||
                     v.name.toLowerCase().includes('apple'))
                ) || voices.find(v => v.lang.startsWith('en'));

                if (voice) {
                    utterance.voice = voice;
                }

                window.speechSynthesis.speak(utterance);
            }
        }
    };

    const toggleTts = () => {
        setTtsEnabled(prev => {
            const nextVal = !prev;
            if (!nextVal) {
                stopAllSpeech();
            }
            return nextVal;
        });
    };

    useEffect(() => {
        if (timerActive) {
            timerIntervalRef.current = setInterval(() => {
                setTimer(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(timerIntervalRef.current);
        }
        return () => clearInterval(timerIntervalRef.current);
    }, [timerActive]);

    const startTimer = () => {
        setTimer(0);
        setTimerActive(true);
    };

    const stopTimer = () => {
        setTimerActive(false);
    };

    useEffect(() => {
        const fetchSession = async () => {
            console.log('Fetching session for ID:', sessionId);
            if (!sessionId || sessionId === 'undefined') {
                console.error('Invalid session ID:', sessionId);
                setError('Invalid session ID. Please try starting a new interview from the dashboard.');
                return;
            }

            try {
                const res = await api.get(`/interview/${sessionId}`);
                console.log('Session data received:', res.data);
                setSession(res.data);
                
                // Load existing chat if any
                const history = [];
                if (res.data.questions && Array.isArray(res.data.questions)) {
                    res.data.questions.forEach((q, i) => {
                        if (q) history.push({ role: 'ai', content: q });
                        if (res.data.answers && res.data.answers[i]) {
                            history.push({ role: 'user', content: res.data.answers[i] });
                            if (res.data.evaluations && res.data.evaluations[i]) {
                                history.push({ role: 'ai', content: `Evaluation: ${res.data.evaluations[i]}` });
                            }
                        }
                    });
                } else {
                    console.warn('No questions found in session data');
                }
                setChat(history);
                
                // Speak the welcome question if this is a brand new session
                if (res.data.questions && res.data.questions.length > 0 && (!res.data.answers || res.data.answers.length === 0)) {
                    setTimeout(() => {
                        speak(res.data.questions[0], true);
                    }, 800);
                }
            } catch (err) {
                console.error('Error fetching session:', err);
                const msg = err.response?.data?.error || err.response?.data?.msg || 'Failed to load interview session';
                setError(msg);
            }
        };
        fetchSession();

        // Initialize Speech Recognition
        if ('webkitSpeechRecognition' in window) {
            const recognition = new window.webkitSpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onresult = (event) => {
                let interimTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        setAnswer(prev => prev + event.results[i][0].transcript);
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        }
    }, [sessionId]);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            stopAllSpeech();
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const handleSend = async () => {
        if (!answer.trim()) return;
        if (isListening) recognitionRef.current.stop();
        stopAllSpeech(); // Stop talking when the user sends their answer
        stopTimer();

        const currentAnswer = answer;
        const responseTime = timer;
        setAnswer('');
        setChat(prev => [...prev, { role: 'user', content: currentAnswer }]);
        setEvaluating(true);

        try {
            const res = await api.post('/interview/answer', {
                sessionId,
                answer: currentAnswer,
                responseTime
            });

            const evaluationContent = `${res.data.evaluation}\n\n**Suggestions:**\n${res.data.suggestions.map(s => `- ${s}`).join('\n')}`;

            setChat(prev => [
                ...prev, 
                { role: 'ai', content: evaluationContent }
            ]);

            // Speak the evaluation first
            speak(res.data.evaluation, true);

            if (res.data.status === 'active') {
                setTimeout(() => {
                    setChat(prev => [...prev, { role: 'ai', content: res.data.nextQuestion }]);
                    // Queue next question to speak after evaluation
                    speak(res.data.nextQuestion, false);
                    startTimer();
                }, 1000);
            } else {
                setTimeout(() => {
                    const completeMsg = "Interview complete! Visit your dashboard for the final report.";
                    setChat(prev => [...prev, { role: 'ai', content: completeMsg }]);
                    // Queue final message
                    speak(completeMsg, false);
                }, 1000);
            }
        } catch (err) {
            console.error(err);
            alert('Failed to submit answer');
            startTimer();
        } finally {
            setEvaluating(false);
        }
    };

    if (error) return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
            <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 text-center max-w-md">
                <div className="text-red-500 text-5xl mb-4">⚠️</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Interview Error</h2>
                <p className="text-gray-500 mb-6">{error}</p>
                <button 
                    onClick={() => navigate('/dashboard')}
                    className="bg-[#1E3A8A] text-white px-8 py-3 rounded-2xl font-bold hover:bg-[#152A63] transition"
                >
                    Back to Dashboard
                </button>
            </div>
        </div>
    );

    if (!session) return <div className="p-10 text-center text-white bg-black">Loading Interview...</div>;

    const latestAiPrompt = [...chat].reverse().find(msg => msg.role === 'ai' && !msg.content.startsWith('Evaluation:'));
    const currentPromptText = latestAiPrompt
        ? latestAiPrompt.content
            .replace(/Evaluation:\s*/i, '')
            .replace(/\*\*Suggestions:\*\*[\s\S]*/g, '')
            .replace(/\n+/g, ' ')
            .trim()
        : 'Your interview is ready. We are waiting for your next response.';

    return (
        <div className="flex flex-col h-screen bg-[#050505] text-white font-sans">
            <div className="p-4 border-b border-white/10 bg-black/80 shadow-sm flex justify-between items-center">
                <div className="flex items-center">
                    <button onClick={() => navigate('/dashboard')} className="mr-4 text-white/70 hover:text-white">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <MessageSquare className="w-6 h-6 text-[#F472B6] mr-2" />
                    <h2 className="text-xl font-bold text-white">AI Technical Interview</h2>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={toggleTts}
                        className={`p-2 rounded-xl border transition-all duration-200 ${
                            ttsEnabled
                                ? 'bg-[#1E1E1E] text-[#F9A8D4] border-[#F472B6]/40 hover:bg-[#2A2A2A]'
                                : 'bg-[#171717] text-gray-400 border-white/10 hover:bg-[#1F1F1F]'
                        }`}
                        title={ttsEnabled ? 'Mute AI Voice' : 'Unmute AI Voice'}
                    >
                        {ttsEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </button>
                    <div className="px-3 py-1 bg-[#1D1D1D] text-[#F9A8D4] rounded-full text-xs font-bold uppercase tracking-wider border border-white/10">
                        Adaptive Mode
                    </div>
                </div>
            </div>

            <div className="flex-1 bg-[#050505] px-6 py-8 overflow-y-auto">
                <div className="mx-auto flex max-w-5xl flex-col gap-6">
                    <div className="flex flex-1 items-center justify-center pt-4">
                        <div className="w-full max-w-3xl rounded-[30px] border border-white/10 bg-[#0B0B0B] p-8 shadow-[0_0_40px_rgba(0,0,0,0.45)] text-center">
                            <div className="mx-auto mb-6 flex h-40 w-40 items-center justify-center rounded-full bg-linear-to-br from-[#1F1F1F] via-[#0A0A0A] to-[#4C153D] shadow-[0_0_50px_rgba(244,114,182,0.25)] ring-1 ring-white/10">
                                <span className="text-7xl">👩‍💼</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pb-2">
                        {chat.map((msg, index) => (
                            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] p-4 rounded-2xl shadow-sm ${
                                    msg.role === 'user'
                                        ? 'bg-[#1E3A8A] text-white rounded-br-none'
                                        : 'bg-[#111111] border border-white/10 text-white rounded-bl-none'
                                }`}>
                                    <div className="prose prose-sm md:prose-base max-w-none text-current prose-invert">
                                        <ReactMarkdown>
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {evaluating && (
                            <div className="flex justify-start">
                                <div className="bg-[#111111] border border-white/10 p-4 rounded-2xl shadow-sm animate-pulse text-white/60 text-sm">
                                    Analyzing your response...
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>
                </div>
            </div>

            <div className="p-4 bg-[#050505] border-t border-white/10">
                <div className="max-w-4xl mx-auto flex items-end space-x-3">
                    <div className="flex-1 relative">
                        <textarea
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            placeholder="Type or speak your answer..."
                            className="w-full p-4 bg-[#111111] border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#F472B6] transition resize-none pr-12 text-white placeholder:text-white/35"
                            rows="2"
                            disabled={evaluating}
                        />
                        <button
                            onClick={toggleListening}
                            className={`absolute right-3 bottom-3 p-2 rounded-full transition ${
                                isListening ? 'bg-red-500/15 text-red-400 animate-bounce' : 'text-white/60 hover:bg-white/5'
                            }`}
                        >
                            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </button>
                    </div>
                    <button
                        onClick={handleSend}
                        disabled={evaluating || !answer.trim()}
                        className="bg-[#F472B6] hover:bg-[#EC4899] text-white p-4 rounded-2xl transition disabled:opacity-50 shadow-md"
                    >
                        <Send className="w-6 h-6" />
                    </button>
                </div>
                <p className="text-center text-xs text-white/40 mt-2">
                    Press the microphone to speak. Your voice will be transcribed in real-time.
                </p>
            </div>
        </div>
    );
};

export default Interview;
