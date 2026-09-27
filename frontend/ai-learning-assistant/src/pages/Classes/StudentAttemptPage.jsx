import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import problemSetService from '../../services/ProblemSetService';
import Spinner from '../../components/common/Spinner';
import Modal from '../../components/common/Modal';

//Student take page: pick an answer per question, submit once at the end. No timer/hint/shield here — those
//belong to the personal quiz XP system, not problem sets.
const StudentAttemptPage = () => {
    const { classData } = useOutletContext();
    const { setId } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selected, setSelected] = useState({}); // { [questionId]: optionId }
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        problemSetService.getAttemptView(classData.id, setId)
            .then((result) => {
                if (result.data.alreadyAttempted) {
                    navigate(`/classes/${classData.id}/problem-sets/${setId}/attempt/result`, { replace: true });
                } else {
                    setData(result.data);
                }
            })
            .catch((error) => {
                toast.error(error.error || "Failed to open this problem set.");
                console.error(error);
                navigate(`/classes/${classData.id}/problem-sets`);
            })
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [classData.id, setId]);

    if (loading || !data) {
        return <div className='flex justify-center py-12'><Spinner /></div>;
    }

    const question = data.questions[currentIndex];
    if (!question) {
        return <p className='text-center text-slate-500 py-12'>This problem set has no questions yet.</p>;
    }

    const answeredCount = Object.keys(selected).length;
    const isLast = currentIndex === data.questions.length - 1;

    //Called by the confirmation modal's Submit button, not directly by the page's Submit button.
    const handleConfirmSubmit = async () => {
        setSubmitting(true);
        try {
            const answers = Object.entries(selected).map(([questionId, optionId]) => ({
                questionId: Number(questionId), optionId
            }));
            await problemSetService.submitAttempt(classData.id, setId, answers);
            toast.success("Submitted successfully.");
            setConfirmOpen(false);
            navigate(`/classes/${classData.id}/problem-sets`);

        } catch (error) {
            toast.error(error.error || "Failed to submit your answers.");
            console.error(error);

        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className='max-w-3xl mx-auto space-y-6'>
            <h1 className='text-xl font-bold text-slate-900'>{data.title}</h1>

            {/* Progress Bar */}
            <div>
                <div className='flex items-center justify-between mb-2'>
                    <span className='text-sm font-semibold text-slate-700'>
                        Question {currentIndex + 1} of {data.questions.length}
                    </span>
                    <span className='text-sm font-medium text-slate-500'>{answeredCount} answered</span>
                </div>
                <div className='relative h-2 bg-slate-100 rounded-full overflow-hidden'>
                    <div
                        className='absolute inset-y-0 left-0 bg-linear-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-500 ease-out'
                        style={{ width: `${((currentIndex + 1) / data.questions.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Question Card */}
            <div className='bg-white/80 backdrop-blur-xl border-2 border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 p-6'>
                <div className='inline-flex items-center gap-2 px-4 py-2 bg-linear-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl mb-6'>
                    <span className='text-sm font-semibold text-purple-700'>Question {currentIndex + 1}</span>
                </div>

                <h3 className='text-lg font-semibold text-slate-900 mb-2 leading-relaxed'>{question.title}</h3>
                {question.description && (
                    <div className='rich-content text-sm text-slate-600 mb-5' dangerouslySetInnerHTML={{ __html: question.description }} />
                )}

                <div className='space-y-3'>
                    {question.options.map((opt) => {
                        const isSelected = selected[question.id] === opt.id;
                        return (
                            <button
                                key={opt.id}
                                onClick={() => setSelected((prev) => ({ ...prev, [question.id]: opt.id }))}
                                className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 ${
                                    isSelected
                                        ? 'border-purple-500 bg-purple-50 text-purple-900'
                                        : 'border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50/50 text-slate-700'
                                }`}
                            >
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                    isSelected ? 'border-purple-500 bg-purple-500' : 'border-slate-300'
                                }`}>
                                    {isSelected && <div className='w-2 h-2 rounded-full bg-white' />}
                                </div>
                                <span className='text-sm font-medium'>{opt.option_text}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Navigation */}
            <div className='flex items-center justify-between'>
                <button
                    onClick={() => setCurrentIndex((i) => i - 1)}
                    disabled={currentIndex === 0}
                    className='px-5 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold hover:bg-slate-50 transition-colors'
                >
                    Previous
                </button>
                {isLast ? (
                    <button
                        onClick={() => setConfirmOpen(true)}
                        className='px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition-colors'
                    >
                        Submit
                    </button>
                ) : (
                    <button
                        onClick={() => setCurrentIndex((i) => i + 1)}
                        className='px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition-colors'
                    >
                        Next
                    </button>
                )}
            </div>

            <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} title='Submit Your Answers'>
                <p className='text-sm text-slate-600 mb-6'>
                    You've answered {answeredCount} of {data.questions.length} questions.
                    Once submitted, you can't change your answers. Are you sure you want to submit?
                </p>
                <div className='flex gap-3'>
                    <button
                        onClick={() => setConfirmOpen(false)}
                        disabled={submitting}
                        className='flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50'
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirmSubmit}
                        disabled={submitting}
                        className='flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white py-2 rounded-lg text-sm font-medium transition-colors'
                    >
                        {submitting ? 'Submitting...' : 'Submit'}
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default StudentAttemptPage;
