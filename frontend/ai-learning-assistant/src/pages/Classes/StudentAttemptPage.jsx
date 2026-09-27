import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { ListChecks, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import problemSetService from '../../services/ProblemSetService';
import Spinner from '../../components/common/Spinner';
import Modal from '../../components/common/Modal';
import AttemptFillBlank from '../../components/classes/ProblemSet/AttemptFillBlank';
import AttemptOpenEnded from '../../components/classes/ProblemSet/AttemptOpenEnded';
import AttachmentList from '../../components/classes/ProblemSet/AttachmentList';
import { hasDescription } from '../../components/classes/ProblemSet/publishChecks';
import QuestionComments from '../../components/classes/ProblemSet/QuestionComments';

//Student take page: one question at a time, submit once at the end. Nothing is sent to the server until the
//student confirms the submission, and then everything (answers + files) goes up together.
const StudentAttemptPage = () => {
    const { classData } = useOutletContext();
    const { setId } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    //One map per question type, all keyed by question id.
    const [selected, setSelected] = useState({}); // mcq: optionId
    const [fills, setFills] = useState({});       // fill_blank: [wordBankIndex | null, ...]
    const [texts, setTexts] = useState({});       // open_ended: answer html
    const [files, setFiles] = useState({});       // open_ended: File[]
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

    const isAnswered = (q) => {
        if (q.type === 'fill_blank') return (fills[q.id] || []).some((f) => f != null);
        if (q.type === 'open_ended') return hasDescription(texts[q.id]) || (files[q.id] || []).length > 0;
        return selected[q.id] != null;
    };
    const answeredCount = data ? data.questions.filter(isAnswered).length : 0;

    //Warn before closing/refreshing the tab once something has been answered, since nothing is saved until submit.
    useEffect(() => {
        if (answeredCount === 0 || submitting) return;
        const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [answeredCount, submitting]);

    if (loading || !data) {
        return <div className='flex justify-center py-12'><Spinner /></div>;
    }

    const question = data.questions[currentIndex];
    if (!question) {
        return <p className='text-center text-slate-500 py-12'>This problem set has no questions yet.</p>;
    }

    const isLast = currentIndex === data.questions.length - 1;
    const unansweredCount = data.questions.length - answeredCount;

    //Called by the confirmation modal's Submit button, not directly by the page's Submit button.
    const handleConfirmSubmit = async () => {
        setSubmitting(true);
        try {
            const answers = data.questions.map((q) => {
                if (q.type === 'fill_blank') {
                    const placed = fills[q.id] || [];
                    return {
                        questionId: q.id,
                        blanks: Array.from({ length: q.blankCount }, (_, i) => placed[i] == null ? '' : q.wordBank[placed[i]])
                    };
                }
                if (q.type === 'open_ended') return { questionId: q.id, text: texts[q.id] || '' };
                return { questionId: q.id, optionId: selected[q.id] ?? null };
            });

            await problemSetService.submitAttempt(classData.id, setId, answers, files);
            toast.success("Submitted successfully.");
            setConfirmOpen(false);
            navigate(`/classes/${classData.id}/problem-sets`);

        } catch (error) {
            toast.error(error.error || error.message || "Failed to submit your answers.");
            console.error(error);

        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className='space-y-6'>
            <div className='flex items-center gap-4'>
                <div className='w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0'>
                    <ListChecks className='w-7 h-7 text-purple-600' strokeWidth={2} />
                </div>
                <h1 className='text-2xl font-bold text-slate-900'>{data.title}</h1>
            </div>

            <div className='max-w-4xl mx-auto space-y-6'>
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

                {/* Question Card — keyed so each question's editors start fresh from the saved answer */}
                <div key={question.id} className='space-y-4'>
                    <div className='bg-white border-2 border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 p-6'>
                        <div className='inline-flex items-center px-4 py-2 bg-linear-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl mb-5'>
                            <span className='text-sm font-semibold text-purple-700'>Question {currentIndex + 1}</span>
                        </div>

                        {question.type === 'fill_blank' ? (
                            <AttemptFillBlank
                                question={question}
                                fills={fills[question.id] || Array(question.blankCount).fill(null)}
                                onChange={(next) => setFills((prev) => ({ ...prev, [question.id]: next }))}
                            />
                        ) : (
                            <>
                                {/* Students see the description as the question itself; the title is only the lecturer's label.
                                    A question with no description falls back to its title so it's never blank. */}
                                {hasDescription(question.description) ? (
                                    <div className='rich-content text-lg font-semibold text-slate-900 leading-relaxed' dangerouslySetInnerHTML={{ __html: question.description }} />
                                ) : (
                                    <h3 className='text-lg font-semibold text-slate-900 leading-relaxed'>{question.title}</h3>
                                )}

                                {question.type !== 'open_ended' && (
                                    <div className='space-y-3 mt-5'>
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
                                )}
                            </>
                        )}
                    </div>

                    {question.type === 'open_ended' && (
                        <>
                            <AttachmentList files={question.files} folder='problem-set-files' />
                            <AttemptOpenEnded
                                classId={classData.id}
                                text={texts[question.id] || ''}
                                files={files[question.id] || []}
                                onTextChange={(next) => setTexts((prev) => ({ ...prev, [question.id]: next }))}
                                onFilesChange={(next) => setFiles((prev) => ({ ...prev, [question.id]: next }))}
                            />
                        </>
                    )}

                    <QuestionComments classId={classData.id} setId={setId} questionId={question.id} />
                </div>

                {/* Navigation */}
                <div className='flex items-center justify-between'>
                    <button
                        onClick={() => setCurrentIndex((i) => i - 1)}
                        disabled={currentIndex === 0}
                        className='px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold hover:bg-slate-50 transition-colors'
                    >
                        Previous
                    </button>
                    {isLast ? (
                        <button
                            onClick={() => setConfirmOpen(true)}
                            className='px-8 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition-colors'
                        >
                            Submit
                        </button>
                    ) : (
                        <button
                            onClick={() => setCurrentIndex((i) => i + 1)}
                            className='px-8 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition-colors'
                        >
                            Next
                        </button>
                    )}
                </div>
            </div>

            <Modal isOpen={confirmOpen} onClose={() => !submitting && setConfirmOpen(false)} title='Submit Your Answers'>
                <p className='text-sm text-slate-600 mb-4'>
                    You've answered {answeredCount} of {data.questions.length} questions.
                    Once submitted, you can't change your answers. Are you sure you want to submit?
                </p>
                {unansweredCount > 0 && (
                    <div className='flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2.5 mb-4'>
                        <AlertTriangle className='w-4 h-4 shrink-0 mt-0.5' />
                        {unansweredCount} question{unansweredCount > 1 ? 's are' : ' is'} still unanswered.
                    </div>
                )}
                <div className='flex gap-3 mt-2'>
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
