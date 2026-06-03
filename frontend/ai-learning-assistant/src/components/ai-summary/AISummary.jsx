import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Bot, BookOpen, Lightbulb } from "lucide-react";
import toast from 'react-hot-toast';
import MarkDownRender from '../common/MarkDownRender';
import aiService from '../../services/AIService';


const AISummary = () => {
    const { id: documentId } = useParams();
    const [loadingAction, setLoadingAction] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState("");
    const [modalTitle, setModalTitle] = useState("");
    const [concept, setConcept] = useState("");

    const handleAISummary = async () => {
        setLoadingAction("summary");

        try {
            const { data } = await aiService.generateSummary(documentId);
            const { summary } = data;
            setModalTitle("Genrated Summary.");
            setModalContent(summary);
            setIsModalOpen(true);

        } catch (error) {
            toast.error('Fail to generate the summary at the AI Summary page');

        } finally {
            setLoadingAction(null);

        }
    };

    return (
        <>
        <div className='bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden'>
            {/* Header */}
            <div className='px-6 py-5 border-b border-slate-200/60 bg-linear-to-br from-slate-50/50 to-white/50'>
                <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 rounded-xl bg-linear-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/25 flex items-center justify-center'>
                        <Bot className="w-5 h-5 text-white" strokeWidth={2} />
                    </div>
                    <div>
                        <h3 className='text-lg font-semibold text-slate-900'>AI Assistant</h3>
                        <p className='text-xs text-slate-500'>Powered by Open AI</p>
                    </div>
                </div>
            </div>

            <div className='p-6 space-y-6'>
                {/* Generate Summary */}
                <div className='group p-5 bg-linear-to-br from-slate-50/50 to-white rounded-xl border border-slate-200/60 hover:border-slate-300/60 hover:shadow-md transition-all duration-200'>
                    <div className='flex items-start justify-between gap-4'>
                        <div className='flex-1'>
                            <div className='flex items-center gap-2 mb-2'>
                                <div className='w-8 h-8 rounded-lg bg-linear-to-br from-purple-100 to-purple-200 flex items-center justify-center'>
                                    <BookOpen className='w-4 h-4 text-purple-600' strokeWidth={2} />
                                </div>
                                <h4 className='font-semibold text-slate-900'>Generate Summary</h4>
                            </div>
                            <p className='text-sm text-slate-600 leading-relaxed'>Get a summary from the documents.</p>
                        </div>
                        <button
                            onClick={handleAISummary}
                            disabled={loadingAction === 'summary'}
                            className='shrink-0 h-10 px-5 bg-linear-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed active:scale-90'
                        >
                            {loadingAction === 'summary' ? (
                                <span className='flex items-center gap-2'>
                                    <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin'/>
                                    Loading...
                                </span>
                            ) : "Summarize"}
                        </button>
                    </div>
                </div>
            </div>

        </div>

            {/* Summary Modwal */}
            {isModalOpen && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4'>
                    <div className='bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col'>
                        <div className='flex items-center justify-between px-6 py-4 border-b border-slate-200'>
                            <h3 className='text-base font-semibold text-slate-900'>{modalTitle}</h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className='w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all'
                            >
                                Cancel
                            </button>
                        </div>
                        <div className='flex-1 overflow-y-auto p-6 prose prose-sm max-w-none prose-slate'>
                            <MarkDownRender content={modalContent} />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default AISummary;