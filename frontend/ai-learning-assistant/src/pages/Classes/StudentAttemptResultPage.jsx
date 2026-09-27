import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import problemSetService from '../../services/ProblemSetService';
import Spinner from '../../components/common/Spinner';

//Lets the student see what they chose, not whether it was right or what they scored — the API itself
//never sends that data here, so there's nothing to accidentally reveal.
const StudentAttemptResultPage = () => {
    const { classData } = useOutletContext();
    const { setId } = useParams();
    const navigate = useNavigate();
    const [questions, setQuestions] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        problemSetService.getAttemptResult(classData.id, setId)
            .then((r) => setQuestions(r.data.questions))
            .catch((error) => {
                toast.error(error.error || "Failed to load your answers.");
                console.error(error);
            })
            .finally(() => setLoading(false));
    }, [classData.id, setId]);

    if (loading) {
        return <div className='flex justify-center py-12'><Spinner /></div>;
    }

    if (!questions) {
        return (
            <div className='text-center py-12'>
                <p className='text-slate-500 mb-4'>No answers found. You may not have attempted this problem set yet.</p>
                <button
                    onClick={() => navigate(`/classes/${classData.id}/problem-sets`)}
                    className='px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-colors'
                >
                    Back to Problem Sets
                </button>
            </div>
        );
    }

    return (
        <div className='max-w-3xl mx-auto space-y-6'>
            <div className='flex items-center justify-between'>
                <div>
                    <h1 className='text-xl font-bold text-slate-900'>Your Answers</h1>
                    <p className='text-sm text-slate-500 mt-0.5'>A review of what you submitted.</p>
                </div>
                <button
                    onClick={() => navigate(`/classes/${classData.id}/problem-sets`)}
                    className='px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-colors'
                >
                    Back to Problem Sets
                </button>
            </div>

            <div className='space-y-4'>
                {questions.map((q, index) => (
                    <div key={q.id} className='bg-white border border-slate-200 rounded-xl p-5'>
                        <p className='text-sm font-semibold text-slate-900 mb-3'>Question {index + 1}: {q.title}</p>
                        {q.description && (
                            <div className='rich-content text-sm text-slate-600 mb-3' dangerouslySetInnerHTML={{ __html: q.description }} />
                        )}
                        <div className='space-y-2'>
                            {q.options.map((opt) => {
                                const wasSelected = q.selectedOptionId === opt.id;
                                return (
                                    <div
                                        key={opt.id}
                                        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border text-sm ${
                                            wasSelected
                                                ? 'border-purple-400 bg-purple-50 text-purple-900 font-medium'
                                                : 'border-slate-200 text-slate-600'
                                        }`}
                                    >
                                        <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                                            wasSelected ? 'border-purple-500 bg-purple-500' : 'border-slate-300'
                                        }`}>
                                            {wasSelected && <div className='w-1.5 h-1.5 rounded-full bg-white' />}
                                        </div>
                                        {opt.option_text}
                                        {wasSelected && <span className='ml-auto text-xs font-semibold text-purple-600'>Your answer</span>}
                                    </div>
                                );
                            })}
                            {q.selectedOptionId == null && (
                                <p className='text-xs text-slate-400 italic'>You didn't answer this question.</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StudentAttemptResultPage;
