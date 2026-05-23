import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Award, 
    Zap, 
    Shield, 
    BarChart3, 
    BrainCircuit, 
    Code2, 
    UserCheck, 
    ChevronRight,
    Star,
    Mail,
    MessageSquare,
    Send,
    Loader2,
    Menu,
    X
} from 'lucide-react';

import logo from '../assets/Gemini_Generated_Image_ga5zozga5zozga5z.png';
import api from '../api';

const Home = () => {
    const navigate = useNavigate();
    const formRef = useRef();
    const [isSending, setIsSending] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Close menu when clicking outside or resizing
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) setIsMenuOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const sendEmail = async (e) => {
        e.preventDefault();
        setIsSending(true);

        const formData = new FormData(formRef.current);
        const data = {
            user_name: formData.get('user_name'),
            user_email: formData.get('user_email'),
            subject: formData.get('subject'),
            message: formData.get('message')
        };

        try {
            await api.post('/contact', data);
            alert("Message sent successfully! We will get back to you soon.");
            formRef.current.reset();
        } catch (error) {
            console.error(error);
            alert("Failed to send message. Please try again or email us directly at support@rprofile.ai");
        } finally {
            setIsSending(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-gray-900 overflow-x-hidden font-sans">
            {/* Elegant Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 md:px-8 py-4 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <img src={logo} alt="RProfile.ai Logo" className="w-8 h-8 md:w-10 md:h-10 rounded-xl shadow-lg shadow-blue-200" />
                    <span className="text-xl md:text-2xl font-black text-[#1E3A8A] tracking-tight">RProfile<span className="text-blue-500">.ai</span></span>
                </div>
                
                {/* Desktop Menu */}
                <div className="hidden md:flex space-x-8 text-sm font-bold uppercase tracking-widest text-gray-500">
                    <a href="#features" className="hover:text-blue-600 transition">Features</a>
                    <a href="#contact" className="hover:text-blue-600 transition">Contact Us</a>
                </div>

                <div className="flex items-center space-x-4">
                    <button 
                        onClick={() => navigate('/login')}
                        className="hidden sm:block bg-[#1E3A8A] text-white px-6 md:px-8 py-2 md:py-3 rounded-2xl font-bold hover:bg-blue-800 transition shadow-lg shadow-blue-100 text-sm md:text-base"
                    >
                        Get Started
                    </button>
                    
                    {/* Mobile Menu Toggle */}
                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                    >
                        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Menu Overlay */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="absolute top-full left-0 w-full bg-white border-b border-gray-100 p-6 md:hidden shadow-xl"
                        >
                            <div className="flex flex-col space-y-6 text-center font-bold uppercase tracking-widest text-gray-500 text-sm">
                                <a href="#features" onClick={() => setIsMenuOpen(false)} className="hover:text-blue-600 transition py-2">Features</a>
                                <a href="#contact" onClick={() => setIsMenuOpen(false)} className="hover:text-blue-600 transition py-2">Contact Us</a>
                                <button 
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        navigate('/login');
                                    }}
                                    className="bg-[#1E3A8A] text-white py-4 rounded-2xl shadow-lg shadow-blue-100"
                                >
                                    Get Started
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 md:pt-40 pb-20 md:pb-32 px-6">
                <div className="container mx-auto max-w-7xl">
                    <div className="grid lg:grid-cols-2 gap-12 md:gap-16 items-center">
                        <motion.div 
                            initial={{ x: -100, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="text-center lg:text-left"
                        >
                            <div className="inline-flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-full mb-6">
                                <img src={logo} alt="Logo" className="w-4 h-4 rounded-sm" />
                                <span className="text-blue-600 text-[10px] md:text-xs font-black uppercase tracking-widest">Top Rated Interview Platform</span>
                            </div>
                            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 leading-[1.1] mb-6 md:mb-8">
                                Land Your <span className="text-[#1E3A8A]">Dream Job</span> with AI Precision.
                            </h1>
                            <p className="text-lg md:text-xl text-gray-500 leading-relaxed mb-8 md:mb-10 max-w-xl mx-auto lg:mx-0">
                                The world's most advanced AI interview copilot. From ATS optimization to real-time coding rounds, we prepare you for the elite 1%.
                            </p>
                            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center lg:justify-start">
                                <button 
                                    onClick={() => navigate('/login')}
                                    className="bg-[#1E3A8A] text-white px-8 md:px-10 py-4 md:py-5 rounded-[2rem] font-black text-base md:text-lg hover:bg-blue-800 transition shadow-2xl shadow-blue-200 flex items-center justify-center group"
                                >
                                    Start Free Session <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                                </button>
                                <button className="bg-white border-2 border-gray-100 text-gray-900 px-8 md:px-10 py-4 md:py-5 rounded-[2rem] font-black text-base md:text-lg hover:border-blue-200 transition">
                                    Watch Demo
                                </button>
                            </div>
                        </motion.div>

                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="relative mt-12 lg:mt-0"
                        >
                            <div className="absolute -top-10 md:-top-20 -left-10 md:-left-20 w-32 md:w-64 h-32 md:h-64 bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
                            <div className="absolute -bottom-10 md:-bottom-20 -right-10 md:-right-20 w-40 md:w-80 h-40 md:h-80 bg-purple-200/30 rounded-full blur-3xl animate-pulse delay-700"></div>
                            <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-2xl relative z-10 border border-gray-50">
                                <div className="grid grid-cols-2 gap-3 md:gap-4">
                                    <div className="bg-gray-50 p-4 md:p-6 rounded-2xl md:rounded-3xl">
                                        <BrainCircuit className="w-8 h-8 md:w-10 md:h-10 text-blue-600 mb-3 md:mb-4" />
                                        <h3 className="font-bold text-base md:text-lg">Adaptive AI</h3>
                                        <p className="text-[10px] md:text-xs text-gray-400 mt-1 md:mt-2">Questions that evolve with your skill level.</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 md:p-6 rounded-2xl md:rounded-3xl">
                                        <BarChart3 className="w-8 h-8 md:w-10 md:h-10 text-purple-600 mb-3 md:mb-4" />
                                        <h3 className="font-bold text-base md:text-lg">Real Analytics</h3>
                                        <p className="text-[10px] md:text-xs text-gray-400 mt-1 md:mt-2">Ground-truth performance tracking.</p>
                                    </div>
                                    <div className="bg-[#1E3A8A] p-4 md:p-6 rounded-2xl md:rounded-3xl text-white col-span-2">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <Code2 className="w-8 h-8 md:w-10 md:h-10 mb-3 md:mb-4" />
                                                <h3 className="font-bold text-lg md:text-xl">Coding Rounds</h3>
                                                <p className="text-[11px] md:text-sm opacity-80 mt-1 md:mt-2">C++, Python, JS supported.</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl md:text-3xl font-black">98.2%</div>
                                                <div className="text-[8px] md:text-[10px] uppercase font-bold tracking-widest opacity-60">Accuracy</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-20 md:py-32 bg-white">
                <div className="container mx-auto px-6 max-w-7xl text-center">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={containerVariants}
                    >
                        <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 md:mb-6">Elite Features for Elite Candidates</h2>
                        <p className="text-gray-500 max-w-2xl mx-auto mb-12 md:mb-20 text-base md:text-lg px-4">Everything you need to bypass automated filters and impress the most demanding interviewers.</p>
                        
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                            {[
                                { icon: BrainCircuit, title: "Multi-Agent AI", desc: "Interviewer, Evaluator, and Coach agents working in sync.", color: "blue" },
                                { icon: UserCheck, title: "ATS IQ Scoring", desc: "Brutally honest resume analysis against real JDs.", color: "green" },
                                { icon: Zap, title: "Instant Feedback", desc: "Detailed corrections and suggestions after every answer.", color: "yellow" },
                                { icon: Shield, title: "Memory Engine", desc: "We track your weak areas across multiple sessions.", color: "purple" },
                                { icon: Code2, title: "Coding Sandbox", desc: "Built-in compiler with support for C++, Python, and JS.", color: "red" },
                                { icon: BarChart3, title: "Mastery Charts", desc: "Visualize your growth with dynamic radar and trend charts.", color: "indigo" }
                            ].map((f, i) => (
                                <motion.div 
                                    key={i} 
                                    variants={itemVariants}
                                    className="p-8 md:p-10 rounded-[2rem] md:rounded-[2.5rem] bg-gray-50 hover:bg-white hover:shadow-2xl hover:shadow-blue-100 transition-all border border-transparent hover:border-gray-100 group text-left"
                                >
                                    <div className={`bg-${f.color}-50 p-4 rounded-2xl w-fit mb-6 group-hover:bg-${f.color}-600 group-hover:text-white transition-colors`}>
                                        <f.icon className="w-6 h-6 md:w-8 md:h-8" />
                                    </div>
                                    <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-3 md:mb-4">{f.title}</h3>
                                    <p className="text-sm md:text-base text-gray-500 leading-relaxed font-medium">{f.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 md:py-32">
                <div className="container mx-auto px-4 md:px-6 max-w-5xl">
                    <div className="bg-[#1E3A8A] rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-16 text-center text-white relative overflow-hidden shadow-3xl">
                        <div className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-blue-400/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                        <div className="relative z-10">
                            <h2 className="text-3xl md:text-5xl font-black mb-6 md:mb-8">Ready to Level Up Your Career?</h2>
                            <p className="text-base md:text-xl text-blue-100 mb-8 md:mb-12 max-w-2xl mx-auto font-medium opacity-80">
                                Join 50,000+ developers who used RProfile.ai to land offers at Google, Meta, and Amazon.
                            </p>
                            <button 
                                onClick={() => navigate('/login')}
                                className="bg-white text-[#1E3A8A] px-10 md:px-12 py-4 md:py-6 rounded-[1.5rem] md:rounded-[2.5rem] font-black text-lg md:text-xl hover:bg-gray-50 transition shadow-2xl"
                            >
                                Get Started Now
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Us Section */}
            <section id="contact" className="py-20 md:py-32 bg-gray-50">
                <div className="container mx-auto px-6 max-w-7xl">
                    <div className="grid lg:grid-cols-2 gap-12 md:gap-16 items-center">
                        <motion.div
                            initial={{ x: -50, opacity: 0 }}
                            whileInView={{ x: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="text-center lg:text-left"
                        >
                            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-6 md:mb-8">Get in Touch with Our Experts</h2>
                            <p className="text-base md:text-xl text-gray-500 mb-8 md:mb-10 leading-relaxed">
                                Have questions about our platform? Our team of technical career coaches and AI engineers are here to help you navigate your journey to the elite 1%.
                            </p>
                            
                            <div className="space-y-4 md:space-y-6 max-w-lg mx-auto lg:mx-0">
                                <div className="flex items-center space-x-4 bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100">
                                    <div className="bg-blue-50 p-3 rounded-xl md:rounded-2xl text-blue-600">
                                        <Mail className="w-5 h-5 md:w-6 md:h-6" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] md:text-sm font-bold text-gray-400 uppercase tracking-widest">Email Us</p>
                                        <p className="text-base md:text-lg font-black text-[#1E3A8A]">support@rprofile.ai</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4 bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100">
                                    <div className="bg-purple-50 p-3 rounded-xl md:rounded-2xl text-purple-600">
                                        <MessageSquare className="w-5 h-5 md:w-6 md:h-6" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] md:text-sm font-bold text-gray-400 uppercase tracking-widest">Live Chat</p>
                                        <p className="text-base md:text-lg font-black text-purple-700">Available 24/7 for Premium Users</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ x: 50, opacity: 0 }}
                            whileInView={{ x: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl border border-gray-100"
                        >
                            <form ref={formRef} onSubmit={sendEmail} className="space-y-5 md:space-y-6">
                                <div className="grid md:grid-cols-2 gap-5 md:gap-6">
                                    <div>
                                        <label className="block text-xs md:text-sm font-bold text-gray-500 uppercase mb-2 ml-1">Your Name</label>
                                        <input 
                                            type="text" 
                                            name="user_name"
                                            required
                                            className="w-full px-5 md:px-6 py-3 md:py-4 bg-gray-50 border border-gray-100 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition text-sm md:text-base"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs md:text-sm font-bold text-gray-500 uppercase mb-2 ml-1">Email Address</label>
                                        <input 
                                            type="email" 
                                            name="user_email"
                                            required
                                            className="w-full px-5 md:px-6 py-3 md:py-4 bg-gray-50 border border-gray-100 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition text-sm md:text-base"
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs md:text-sm font-bold text-gray-500 uppercase mb-2 ml-1">Subject</label>
                                    <input 
                                        type="text" 
                                        name="subject"
                                        required
                                        className="w-full px-5 md:px-6 py-3 md:py-4 bg-gray-50 border border-gray-100 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition text-sm md:text-base"
                                        placeholder="How can we help?"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs md:text-sm font-bold text-gray-500 uppercase mb-2 ml-1">Message</label>
                                    <textarea 
                                        name="message"
                                        required
                                        rows="4"
                                        className="w-full px-5 md:px-6 py-3 md:py-4 bg-gray-50 border border-gray-100 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition resize-none text-sm md:text-base"
                                        placeholder="Your message here..."
                                    ></textarea>
                                </div>
                                <button 
                                    type="submit"
                                    disabled={isSending}
                                    className="w-full py-4 md:py-5 bg-[#1E3A8A] text-white rounded-[1.5rem] md:rounded-[2rem] font-black text-lg md:text-xl hover:bg-blue-800 transition shadow-xl shadow-blue-100 flex items-center justify-center space-x-2 disabled:opacity-70"
                                >
                                    {isSending ? (
                                        <>
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                            <span>Sending...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-6 h-6" />
                                            <span>Send Message</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                </div>
            </section>

            <footer className="py-12 md:py-20 border-t border-gray-100 text-center">
                <div className="flex items-center justify-center space-x-2 mb-6 md:mb-8">
                    <img src={logo} alt="RProfile.ai Logo" className="w-6 h-6 md:w-8 md:h-8 rounded-lg opacity-50 grayscale hover:grayscale-0 transition" />
                    <span className="text-lg md:text-xl font-black text-gray-400 tracking-tight">RProfile<span className="text-gray-300">.ai</span></span>
                </div>
                <p className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">© 2026 RProfile.ai. Built for the Elite.</p>
            </footer>
        </div>
    );
};

export default Home;
