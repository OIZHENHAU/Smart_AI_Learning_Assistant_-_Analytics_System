import React, { useState, useEffect, useRef } from 'react';
import { Send , MessageSquare, Sparkles } from 'lucide-react';
import { useParams } from 'react-router-dom';
import aiService from '../../services/AIService';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../common/Spinner';
import MarkDownRender from '../common/MarkDownRender';


const AIChatInterface = () => {
    const {id: documentId } = useParams();
    const { user } = useAuth();
    const [history, setHistory] = useState([]);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const messageEndRef = useRef(null);

    const scrollToBottom = () => {
        messageEndRef.current?.scrollIntoView({ behaviour: "smooth" });
    };

    useEffect(() => {
        const fetchDocumentChatHistory = async () => {
            try {
                setInitialLoading(true);
                const response = await aiService.getChatHistory(documentId);
                const allMessages = (response.data || []).flatMap(chat => chat.messages || []);
                setHistory(allMessages);

            } catch (error) {
                console.error("FAIL to fetch the chat history for the particular document at the interface due to: ", error);

            } finally {
                setInitialLoading(false);

            }
        };

        fetchDocumentChatHistory();
    }, [documentId]);

    useEffect(() => {
        scrollToBottom();
    }, [history]);

    const handleSendMessage = async (x) => {
        x.preventDefault();

        if (!message.trim()) {
            return;
        }

        const userMessage = { role: 'user', content: message, timestamp: new Date() };
        setHistory(prev => [...prev, userMessage]);
        setMessage('');
        setLoading(true);

        try {
            const response = await aiService.chat(documentId, userMessage.content);
            const aiAssistantMesage = {
                role: 'assistant',
                content: response.data.answer,
                timestamp: new Date(),
                relevantChunks: response.data.relevantChunks
            };
            setHistory(prev => [...prev, aiAssistantMesage]);

        } catch (error) {
            console.error("Encounter chat error at the chat interface due to: ", error);
            const errorMessage = {
                role: 'assistant',
                content: "Apologize of encounter an error when fetch chat history.",
                timestamp: new Date()
            };

            setHistory(prev => [...prev, errorMessage]);

        } finally {
            setLoading(false);

        }
    };

    const renderMessage = (message, index) => {
        const isUser = message.role === 'user';

        return (
            <div
                key={index}
                className={`flex items-start gap-3 my-4 ${ isUser ? 'justify-end' : "" }`}
            >
                {!isUser && (
                    <div className='w-9 h-9 rounded-xl bg-linear-to-br from-purple-400 to-purple-500 shadow-lg shadow-purple-500/25 flex items-center justify-center shrink-0'>
                        <Sparkles className='w-4 h-4 text-white' strokeWidth={2} />
                    </div>
                )}

                <div className={`max-w-lg p-4 rounded-2xl shadow-sm ${
                    isUser
                    ? 'bg-linear-to-br from-purple-500 to-purple-600 text-white rounded-br-md'
                    : 'bg-white border border-slate-200/60 text-slate-800 rounded-bl-md'
                }`}>
                    {isUser ? (
                        <p className='text-sm leading-relaxed'>{message.content}</p>
                    ) : (
                        <div className='prose prose-sm max-w-none prose-slate'>
                            <MarkDownRender content={message.content}/>
                        </div>
                    )}
                </div>
                {isUser && (
                    <div className='w-9 h-9 rounded-xl bg-linear-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-700 font-semibold text-sm shrink-0 shadow-sm'>
                        { user?.username?.charAt(0).toUpperCase() || 'U' }
                    </div>
                )}
            </div>
        )

    };

    if (initialLoading) {
        return (
            <div className='flex flex-col h-[70vh] bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl items-center justify-center shadow-xl shadow-slate-200/50'>
                <div className='w-14 h-14 rounded-2xl bg-linear-to-br from-purple-100 to-purple-200 flex items-center justify-center mb-4'>
                    <MessageSquare className='w-7 h-7 text-purple-600' strokeWidth={2}/>
                </div>
                <Spinner />
                <p className='text-sm text-slate-500 mt-3 font-medium'>Loading Chat History....</p>
            </div>
        );
    }

    return (
        <div className='flex flex-col h-[70vh] bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-xl shaow-slate-200/50 overflow-hidden'>
            <div className='flex-1 p-6 overflow-y-auto bg-linear-to-br from-slate-50/50 via-white/50 to-slate-50/50'>
                {history.length === 0 ? (
                    <div className='flex flex-col items-center justify-center h-full text-center'>
                        <div className='w-16 h-16 rounded-2xl bg-linear-to-br from-purple-200 to-purple-300 flex items-center justify-center mb-4 shadow-lg shadow-purple-500/50'>
                            <MessageSquare className='w-8 h-8 text-purple-600' strokeWidth={2} />
                        </div>
                        <h3 className='text-base font-semibold text-slate-900 mb-2'>Start a Conversation.</h3>
                        <p className='text-sm text-slate-500'>Ask me anything about the document!</p>
                    </div>
                ) : (
                 history.map(renderMessage)
                )}
                <div ref={messageEndRef}/>
                {loading && (
                    <div className='flex items-center gap-3 my-4'>
                        <div className='w-9 h-9 rounded-xl bg-linear-to-br from-purple-400 to-purple-500 shadow-lg shadow-purple-500/25 flex items-center justify-center shrink-0'>
                            <Sparkles className='w-4 h-4 text-white' strokeWidth={2} />
                        </div>
                        <div className='flex items-center gap-2 px-4 py-3 rounded-2xl rounded-bl-md bg-white border border-slate-200/60'>
                            <div className='flex gap-1'>
                                <span className='w-2 h-2 bg-slate-400 rounded-full animate-bounce' style={{ animationDelay: '0ms' }}></span>
                                <span className='w-2 h-2 bg-slate-400 rounded-full animate-bounce' style={{ animationDelay: '150ms' }}></span>
                                <span className='w-2 h-2 bg-slate-400 rounded-full animate-bounce' style={{ animationDelay: '300ms' }}></span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className='p-5 border-t border-slate-200/60 bg-white/80'>
                <form onSubmit={handleSendMessage} className='flex items-center gap-3'>
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="As a question..."
                        className='flex-1 h-12 px-4 border-2 border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 placeholder-slate-400 text-sm font-medium transition-all duration-200 focus:outline-none focus:from-purple-500 focus:bg-white focus:shadow-lg focus:shadow-purple-500/10'
                        disabled={loading} 
                    />
                    <button
                        type="submit"
                        disabled={loading || !message.trim()}
                        className='shrink-0 w-12 h-12 bg-linear-to-r from-purple-400 to-purple-500 hover:from-purple-500 hover:to-purple-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center transition-all duration-200 shadow-lg shadow-purple-500/25'
                    >
                        <Send className='w-5 h-5' strokeWidth={2}/>
                    </button>
                </form>
            </div>
        </div>
    );
}

export default AIChatInterface