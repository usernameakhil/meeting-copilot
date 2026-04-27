import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Chat() {
  const { meetingId } = useParams(); // Gets the ID from the URL (/chat/meet_123)
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input; // Capture input before clearing
    setInput('');
    setIsTyping(true);

    try {
      // 1. Send the question to your FastAPI Chat endpoint
      const response = await fetch('http://127.0.0.1:8080/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meeting_id: meetingId,
          question: currentInput,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // 2. Add Gemini's response to the chat
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.answer 
        }]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error("Chatbot Error:", error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "⚠️ Sorry, I'm having trouble connecting to the server. Make sure your Python backend is running on port 8080." 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-120px)] flex flex-col p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <Link to="/history" className="text-slate-400 hover:text-indigo-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </Link>
          <div>
            <h2 className="font-bold text-slate-800">Meeting Assistant</h2>
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{meetingId}</p>
          </div>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-6 px-2">
        {messages.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <p className="text-sm font-medium">Ask me anything about this meeting!</p>
            <p className="text-[10px] mt-1 opacity-60 italic">e.g., "What were the main action items?"</p>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none shadow-md' 
                : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none shadow-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-100 text-slate-400 px-4 py-2 rounded-2xl rounded-tl-none text-xs animate-pulse">
              AI is thinking...
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Box */}
      <form onSubmit={handleSendMessage} className="relative">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about the transcript..."
          className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 pr-16 shadow-lg focus:outline-none focus:border-indigo-500 transition-all text-sm"
        />
        <button 
          type="submit"
          className="absolute right-3 top-2.5 bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 transition shadow-md"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
        </button>
      </form>
    </div>
  );
}