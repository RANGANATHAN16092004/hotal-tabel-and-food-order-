'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, X, MoreHorizontal, Sparkles } from 'lucide-react';
import { aiAPI } from '@/lib/api';

export default function AIAssistant({ context = 'customer', hotelId = null, customerId = null }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: context === 'admin'
                ? "Hello! I'm your Restaurant Management AI. How can I help you today?"
                : context === 'staff'
                    ? "Hi! I'm your AI Staff Assistant. Need help managing operations?"
                    : "Welcome to DineSmart! I'm your AI Waiter. Can I recommend something delicious?"
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const response = await aiAPI.chat({
                message: userMessage,
                context,
                hotelId,
                customerId
            });

            if (response.data.success) {
                setMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: "Oops, something went wrong on my end." }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting right now. Please try again later." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] font-outfit">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-16 right-0 w-[350px] sm:w-[400px] h-[500px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden mb-4"
                    >
                        {/* Header */}
                        <div className="bg-indigo-600 p-4 text-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                                    <Sparkles size={18} className="text-white" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold">
                                        {context === 'admin' ? 'Operations AI' : context === 'staff' ? 'Staff Assist AI' : 'Smart Waiter AI'}
                                    </span>
                                    <span className="text-[10px] text-indigo-200 uppercase tracking-widest font-black leading-tight">Always Online</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950">
                            {messages.map((msg, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[85%] rounded-[1.5rem] px-5 py-3 ${msg.role === 'user'
                                            ? 'bg-indigo-600 text-white rounded-br-sm'
                                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-sm shadow-sm'
                                        }`}>
                                        <p className="text-sm font-medium leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>
                                            {msg.content}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                            {isLoading && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex justify-start"
                                >
                                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-sm px-5 py-4 shadow-sm text-slate-400">
                                        <MoreHorizontal size={20} className="animate-pulse" />
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
                            <form
                                onSubmit={handleSend}
                                className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-3xl border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all"
                            >
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={context === 'admin' ? "Ask about sales, trends..." : context === 'staff' ? "Ask about orders, protocol..." : "Ask for recommendations..."}
                                    className="flex-1 bg-transparent px-4 text-sm outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isLoading}
                                    className="h-10 w-10 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-colors shrink-0"
                                >
                                    <Send size={16} className="ml-0.5" />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="h-16 w-16 bg-slate-900 dark:bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-2xl shadow-indigo-500/30 lg:ml-auto"
            >
                {isOpen ? <X size={26} /> : <Bot size={28} />}
            </motion.button>
        </div>
    );
}
