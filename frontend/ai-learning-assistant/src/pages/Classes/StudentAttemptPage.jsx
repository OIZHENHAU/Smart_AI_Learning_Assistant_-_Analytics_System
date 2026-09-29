import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { ListChecks, AlertTriangle, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import moment from 'moment';
import problemSetService from '../../services/ProblemSetService';
import Spinner from '../../components/common/Spinner';
import Modal from '../../components/common/Modal';
import AttemptFillBlank from '../../components/classes/ProblemSet/AttemptFillBlank';
import AttemptOpenEnded from '../../components/classes/ProblemSet/AttemptOpenEnded';
import AttachmentList from '../../components/classes/ProblemSet/AttachmentList';
import { hasDescription } from '../../components/classes/ProblemSet/publishChecks';
import QuestionComments from '../../components/classes/ProblemSet/QuestionComments';

const toFills = (question, words = []) => {
    const used = new Set();
    return Array.from({ length: question.blankCount }, (_, i) => {
        const word = words[i];
        if (!word) return null;
        const index = question.wordBank.findIndex((w, j) => w === word && !used.has(j));
        if (index === -1) return null;
        used.add(index);
        return index;
    });
};

const groupFiles = (files = []) => files.reduce((groups, file) => ({
    ...groups, [file.question_id]: [...(groups[file.question_id] || []), file]
}), {});


const StudentAttemptPage = () => {
    const { classData } = useOutletContext();
    const { setId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selected, setSelected] = useState({}); 
    const [fills, setFills] = useState({});
    const [texts, setTexts] = useState({});
    const [files, setFiles] = useState({});
    const [savedFiles, setSavedFiles] = useState({});
    const [savedAt, setSavedAt] = useState(null);
    const [dirty, setDirty] = useState(false);
    const [saving, setSaving] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const restoreDraft = (questions, draft) => {
        if (!draft) return;
        const nextSelected = {};
        const nextFills = {};
        const nextTexts = {};
        for (const answer of draft.answers) {
            const q = questions.find((item) => item.id === answer.questionId);
            if (!q) continue;
            if (q.type === 'fill_blank') nextFills[q.id] = toFills(q, answer.blanks);
            else if (q.type === 'open_ended') { if (answer.text) nextTexts[q.id] = answer.text; }
            else if (answer.optionId != null) nextSelected[q.id] = answer.optionId;
        }
        setSelected(nextSelected);
        setFills(nextFills);
        setTexts(nextTexts);
        setSavedFiles(groupFiles(draft.files));
        setSavedAt(draft.savedAt);
    };

    useEffect(() => {
        problemSetService.getAttemptView(classData.id, setId)
            .then((result) => {
                if (result.data.alreadyAttempted) {
                    navigate(`/classes/${classData.id}/problem-sets/${setId}/attempt/result`, { replace: true });
                } else {
                    setData(result.data);
                    restoreDraft(result.data.questions, result.data.draft);
                }
            })
            .catch((error) => {
                toast.error(error.error || "Failed to open this problem set.");
                console.error(error);
                navigate(`/classes/${classData.id}/problem-sets`);
            })
            .finally(() => setLoading(false));
    }, [classData.id, setId]);


    const edit = (setter, questionId, value) => {
        setter((prev) => ({ ...prev, [questionId]: value }));
        setDirty(true);
    };

    const isAnswered = (q) => {
        if (q.type === 'fill_blank') return (fills[q.id] || []).some((f) => f != null);
        if (q.type === 'open_ended') {
            return hasDescription(texts[q.id]) || (files[q.id] || []).length > 0 || (savedFiles[q.id] || []).length > 0;
        }
        return selected[q.id] != null;
    };
    const answeredCount = data ? data.questions.filter(isAnswered).length : 0;

    
    useEffect(() => {
        if (!dirty || submitting) return;
        const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [dirty, submitting]);

    if (loading || !data) {
        return <div className='flex justify-center py-12'><Spinner /></div>;
    }

    const question = data.questions[currentIndex];
    if (!question) {
        return <p className='text-center text-slate-500 py-12'>This problem set has no questions yet.</p>;
    }

    const isLast = currentIndex === data.questions.length - 1;
    const unansweredCount = data.questions.length - answeredCount;

    
    const buildAnswers = () => data.questions.map((q) => {
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
    const keepFileIds = () => Object.values(savedFiles).flat().map((f) => f.id);

    const handleSave = async () => {
        setSaving(true);
        try {
            const result = await problemSetService.saveAttemptDraft(classData.id, setId, buildAnswers(), files, keepFileIds());
            setSavedFiles(groupFiles(result.data?.files));
            setFiles({});
            setSavedAt(result.data?.savedAt || new Date());
            setDirty(false);
            toast.success("Attempt saved. You can come back and continue later.");

        } catch (error) {
            toast.error(error.error || error.message || "Failed to save your attempt.");
            console.error(error);

        } finally {
            setSaving(false);
        }
    };

    const handleConfirmSubmit = async () => {
        setSubmitting(true);
        try {
            await problemSetService.submitAttempt(classData.id, setId, buildAnswers(), files, keepFileIds());
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
            <div className='flex flex-wrap items-center justify-between gap-4'>
                <div className='flex items-center gap-4 min-w-0'>
                    <div className='w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0'>
                        <ListChecks className='w-7 h-7 text-purple-600' strokeWidth={2} />
                    </div>
                    <h1 className='text-2xl font-bold text-slate-900'>{data.title}</h1>
                </div>
                <div className='flex items-center gap-3'>
                    <span className={`text-xs ${dirty ? 'text-amber-600' : 'text-slate-400'}`}>
                        {dirty ? 'Unsaved changes' : savedAt ? `Saved at ${moment(savedAt).format('h:mma, D MMM')}` : ''}
                    </span>
                    <button
                        onClick={handleSave}
                        disabled={saving || submitting || (!dirty && !!savedAt)}
                        className='flex items-center gap-2 border border-purple-300 text-purple-600 hover:bg-purple-50 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:hover:bg-transparent'
                    >
                        <Save className='w-4 h-4' /> {saving ? 'Saving...' : 'Save Attempt'}
                    </button>
                </div>
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

                <div key={question.id} className='space-y-4'>
                    <div className='bg-white border-2 border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 p-6'>
                        <div className='inline-flex items-center px-4 py-2 bg-linear-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl mb-5'>
                            <span className='text-sm font-semibold text-purple-700'>Question {currentIndex + 1}</span>
                        </div>

                        {question.type === 'fill_blank' ? (
                            <AttemptFillBlank
                                question={question}
                                fills={fills[question.id] || Array(question.blankCount).fill(null)}
                                onChange={(next) => edit(setFills, question.id, next)}
                            />
                        ) : (
                            <>
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
                                                    onClick={() => edit(setSelected, question.id, opt.id)}
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
                                savedFiles={savedFiles[question.id] || []}
                                onTextChange={(next) => edit(setTexts, question.id, next)}
                                onFilesChange={(next) => edit(setFiles, question.id, next)}
                                onSavedFilesChange={(next) => edit(setSavedFiles, question.id, next)}
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
