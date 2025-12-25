import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, User } from 'lucide-react';
import { Chat, GenerateContentResponse } from "@google/genai";
import { initializeChat } from '../services/geminiService';
import { FileData, AnalysisResult, ChatMessage } from '../types';

interface ChatInterfaceProps {
  files: FileData[];
  analysisData: AnalysisResult;
}

// Simple Markdown renderer for chat messages
const MarkdownText: React.FC<{ content: string }> = ({ content }) => {
  if (!content) return null;
  const lines = content.split('\n');
  return (
    <div className="space-y-1 text-sm leading-relaxed">
      {lines.map((line, idx) => {
        if (line.startsWith('### ')) return <h3 key={idx} className="font-bold mt-2 mb-1">{line.replace('### ', '')}</h3>;
        if (line.startsWith('## ')) return <h3 key={idx} className="font-bold mt-2 mb-1">{line.replace('## ', '')}</h3>;
        if (line.startsWith('- ') || line.startsWith('* ')) return <div key={idx} className="flex items-start ml-2"><span className="mr-2">•</span><span>{line.substring(2)}</span></div>;
        if (line.trim() === '') return <br key={idx} />;
        
        const parts = line.split('**');
        if (parts.length > 1) {
            return (
                <p key={idx}>
                    {parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part)}
                </p>
            )
        }
        return <p key={idx}>{line}</p>;
      })}
    </div>
  );
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ files, analysisData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize chat session on mount
    const init = async () => {
      try {
        setIsInitializing(true);
        const chat = await initializeChat(files, analysisData);
        chatSessionRef.current = chat;
        
        // Add welcome message
        setMessages([
          {
            id: 'welcome',
            role: 'model',
            text: "I've reviewed your files and the report. I can help you drill deeper into specific metrics, explain trends, or brainstorm content ideas based on this data. What would you like to know?"
          }
        ]);
      } catch (error) {
        console.error("Failed to init chat", error);
        setMessages([{
          id: 'error',
          role: 'model',
          text: "I'm sorry, I couldn't connect to the analysis engine. Please try refreshing the page."
        }]);
      } finally {
        setIsInitializing(false);
      }
    };

    init();
  }, [files, analysisData]);

  useEffect(() => {
    // Auto-scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || !chatSessionRef.current || isTyping) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const resultStream = await chatSessionRef.current.sendMessageStream({ message: userMessage.text });
      
      const botMessageId = (Date.now() + 1).toString();
      
      // Create a placeholder for the bot message
      setMessages(prev => [
        ...prev, 
        { id: botMessageId, role: 'model', text: '', isStreaming: true }
      ]);

      let fullText = '';
      
      for await (const chunk of resultStream) {
        const c = chunk as GenerateContentResponse;
        if (c.text) {
          fullText += c.text;
          setMessages(prev => prev.map(msg => 
            msg.id === botMessageId ? { ...msg, text: fullText } : msg
          ));
        }
      }
      
      setMessages(prev => prev.map(msg => 
        msg.id === botMessageId ? { ...msg, isStreaming: false } : msg
      ));

    } catch (error) {
      console.error("Chat error", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "I encountered an error processing your request. Please try again."
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all transform hover:scale-105 z-50 flex items-center gap-2 group"
      >
        <MessageCircle size={24} />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap font-medium">
          Ask ConTima AI
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-6rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-2xl text-white">
        <div className="flex items-center gap-2">
          <div className="bg-white/20 p-1.5 rounded-lg">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-sm">ConTima Assistant</h3>
            <p className="text-xs text-blue-100 flex items-center gap-1">
              {isInitializing ? (
                <>
                  <Loader2 size={10} className="animate-spin" />
                  Initializing...
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                  Online
                </>
              )}
            </p>
          </div>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-white/20 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
              ${msg.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-blue-100 text-blue-600'}
            `}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            
            <div className={`
              max-w-[80%] p-3 rounded-2xl text-sm
              ${msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-sm'}
            `}>
              {msg.role === 'user' ? (
                <p>{msg.text}</p>
              ) : (
                <MarkdownText content={msg.text} />
              )}
            </div>
          </div>
        ))}
        {isTyping && !messages.some(m => m.isStreaming) && (
          <div className="flex items-start gap-3">
             <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-100 text-blue-600">
               <Bot size={16} />
             </div>
             <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm">
               <Loader2 size={16} className="animate-spin text-slate-400" />
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-100 rounded-b-2xl">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask a follow-up question..."
            disabled={isInitializing || isTyping}
            className="flex-1 bg-transparent border-none focus:outline-none text-sm text-slate-700 placeholder:text-slate-400 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isInitializing || isTyping}
            className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;