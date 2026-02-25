
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Terminal, Code2 } from 'lucide-react';
import { ChatMessage } from '../types';
import { sendChatMessage } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

const AILab: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: "Initializing Lakshita Academy... \n\nI am ready to assist with strategy development, backtesting scripts, or market sentiment analysis. Try asking: \n\n> *\"Write a Python script for a Mean Reversion strategy with Bollinger Bands.\"*",
      timestamp: Date.now()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
    }));

    const responseText = await sendChatMessage(history, userMsg.text);

    const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText || "Signal lost. Retrying connection...",
        timestamp: Date.now()
    };

    setMessages(prev => [...prev, botMsg]);
    setIsTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-6 max-w-6xl mx-auto w-full">
        <div className="bg-samp-surface border border-white/5 rounded-2xl shadow-2xl flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-white/5 bg-black/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-tr from-samp-primary to-purple-600 p-2 rounded-lg">
                        <Code2 size={20} className="text-white" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-white">Strategy Lab</h2>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                            <span className="w-2 h-2 bg-samp-accent rounded-full animate-pulse"></span>
                            Developer Mode Active
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[#09090b]">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-gray-700' : 'bg-samp-primary/20'}`}>
                            {msg.role === 'user' ? <User size={16} /> : <Bot size={16} className="text-samp-primary" />}
                        </div>
                        
                        <div className={`flex flex-col max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                                msg.role === 'user' 
                                ? 'bg-samp-primary text-white rounded-br-none' 
                                : 'bg-[#18181b] text-gray-200 rounded-bl-none border border-white/5'
                            }`}>
                                <div className="prose prose-invert prose-sm max-w-none font-sans">
                                    <ReactMarkdown
                                        components={{
                                            code({node, className, children, ...props}) {
                                                const match = /language-(\w+)/.exec(className || '')
                                                const isInline = !match && !String(children).includes('\n');
                                                return !isInline ? (
                                                <div className="relative group my-4 rounded-lg overflow-hidden border border-white/10 shadow-lg">
                                                    <div className="flex items-center justify-between bg-[#0f0f11] px-3 py-1.5 border-b border-white/5">
                                                        <span className="text-[10px] text-gray-400 uppercase font-mono">{match ? match[1] : 'code'}</span>
                                                        <div className="flex gap-1.5">
                                                            <div className="w-2 h-2 rounded-full bg-red-500/20"></div>
                                                            <div className="w-2 h-2 rounded-full bg-yellow-500/20"></div>
                                                            <div className="w-2 h-2 rounded-full bg-green-500/20"></div>
                                                        </div>
                                                    </div>
                                                    <pre className="bg-[#0f0f11] p-4 overflow-x-auto text-xs font-mono text-gray-300 m-0">
                                                        <code {...props} className={className}>
                                                            {children}
                                                        </code>
                                                    </pre>
                                                </div>
                                                ) : (
                                                <code {...props} className="bg-white/10 px-1 py-0.5 rounded text-samp-accent font-mono text-xs">
                                                    {children}
                                                </code>
                                                )
                                            }
                                        }}
                                    >
                                        {msg.text}
                                    </ReactMarkdown>
                                </div>
                            </div>
                            <span className="text-[10px] text-gray-600 mt-1 px-1">
                                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                        </div>
                    </div>
                ))}
                
                {isTyping && (
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-samp-primary/20 flex items-center justify-center">
                            <Sparkles size={16} className="text-samp-primary" />
                        </div>
                        <div className="bg-[#18181b] px-4 py-3 rounded-2xl rounded-bl-none flex items-center gap-1 border border-white/5">
                            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-black/20 border-t border-white/5">
                <div className="relative flex items-center gap-2 max-w-4xl mx-auto">
                    <div className="absolute left-3 text-gray-500">
                        <Terminal size={18} />
                    </div>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Define a strategy..."
                        className="w-full bg-samp-bg border border-white/10 rounded-xl py-3 pl-10 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-samp-primary focus:ring-1 focus:ring-samp-primary transition-all shadow-inner font-mono text-sm"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isTyping}
                        className="absolute right-2 p-2 bg-samp-primary hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-samp-primary text-white rounded-lg transition-colors"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default AILab;
