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

    useEffect(() => {
        ttsEnabledRef.current = ttsEnabled;
    }, [ttsEnabled]);

    const stopAllSpeech = () => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        if (audioRef.current) {
            audioRef.current.pause();
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
        if (!ttsEnabledRef.current) return;

        if (cancelExisting) {
            stopAllSpeech();
        }

        // Clean markdown notation to make it sound natural
        let cleanText = text
            .replace(/\*\*Suggestions:\*\*/g, 'Suggestions:')
            .replace(/[\#\*\_`~\[\]\(\)\-\+\>\!]/g, '') // remove markdown characters
            .replace(/\n+/g, ' ') // replace line breaks with spaces
            .trim();

        if (!cleanText) return;

        // 1. Try to use the high-quality Neural TTS endpoint from the backend
        try {
            const res = await api.post('/interview/tts', { text: cleanText }, { responseType: 'blob' });
            
            // Create an audio player and play the neural sound
            const audioUrl = URL.createObjectURL(res.data);
            const audio = new Audio(audioUrl);
            audioRef.current = audio;
            
            audio.onended = () => {
                if (audioRef.current === audio) {
                    audioRef.current = null;
                }
            };

            await audio.play();
        } catch (err) {
            // 2. Fallback to Browser Native SpeechSynthesis with optimized voices
            console.log('Neural TTS not configured or failed, falling back to browser voice.');
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(cleanText);
                utterance.lang = 'en-US';
                
                // Prioritize Natural/Online/Google/Apple voices
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

    if (!session) return <div className="p-10 text-center text-gray-600">Loading Interview...</div>;

    return (
        <div className="flex flex-col h-screen bg-[#F8FAFC] text-gray-800 font-sans">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-white shadow-sm flex justify-between items-center">
                <div className="flex items-center">
                    <button onClick={() => navigate('/dashboard')} className="mr-4 text-gray-500 hover:text-[#1E3A8A]">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <MessageSquare className="w-6 h-6 text-[#1E3A8A] mr-2" />
                    <h2 className="text-xl font-bold text-[#1E3A8A]">AI Technical Interview</h2>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={toggleTts}
                        className={`p-2 rounded-xl border transition-all duration-200 ${
                            ttsEnabled 
                                ? 'bg-blue-50 text-[#1E3A8A] border-blue-200 hover:bg-blue-100' 
                                : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
                        }`}
                        title={ttsEnabled ? 'Mute AI Voice' : 'Unmute AI Voice'}
                    >
                        {ttsEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </button>
                    <div className="px-3 py-1 bg-[#E0E7FF] text-[#1E3A8A] rounded-full text-xs font-bold uppercase tracking-wider">
                        Adaptive Mode
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {chat.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] p-4 rounded-2xl shadow-sm ${
                            msg.role === 'user' 
                                ? 'bg-[#1E3A8A] text-white rounded-br-none' 
                                : 'bg-white border border-gray-100 text-gray-700 rounded-bl-none'
                        }`}>
                            <div className="prose prose-sm md:prose-base max-w-none text-current">
                                <ReactMarkdown>
                                    {msg.content}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </div>
                ))}
                {evaluating && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm animate-pulse text-gray-400 text-sm">
                            Analyzing your response...
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-200">
                <div className="max-w-4xl mx-auto flex items-end space-x-3">
                    <div className="flex-1 relative">
                        <textarea
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            placeholder="Type or speak your answer..."
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] transition resize-none pr-12"
                            rows="2"
                            disabled={evaluating}
                        />
                        <button
                            onClick={toggleListening}
                            className={`absolute right-3 bottom-3 p-2 rounded-full transition ${
                                isListening ? 'bg-red-100 text-red-600 animate-bounce' : 'text-gray-400 hover:bg-gray-100'
                            }`}
                        >
                            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </button>
                    </div>
                    <button
                        onClick={handleSend}
                        disabled={evaluating || !answer.trim()}
                        className="bg-[#1E3A8A] hover:bg-[#152A63] text-white p-4 rounded-2xl transition disabled:opacity-50 shadow-md"
                    >
                        <Send className="w-6 h-6" />
                    </button>
                </div>
                <p className="text-center text-xs text-gray-400 mt-2">
                    Press the microphone to speak. Your voice will be transcribed in real-time.
                </p>
            </div>
        </div>
    );
};

export default Interview;
