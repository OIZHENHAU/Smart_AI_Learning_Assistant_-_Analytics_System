import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { ClipboardCheck, AlertTriangle, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import moment from 'moment';
import submissionService from '../../services/SubmissionService';
import Spinner from '../../components/common/Spinner';
import Modal from '../../components/common/Modal';
import GradeQuestionCard from '../../components/classes/Submission/GradeQuestionCard';
import GradingSummary from '../../components/classes/Submission/GradingSummary';
import { useAuth } from '../../context/AuthContext';
import { formatPoints } from '../../utils/formatPoints';

const STAFF_ROLES = ['lecturer', 'parents', 'admin'];

const hasText = (html) => (html || '').replace(/<[^>]*>/g, '').trim().length > 0;

//A mark is valid when it's a number from 0 to the question's points (a 0-point question is always 0).
const isValidMark = (q, value) => {
    if (q.points === 0) return true;
    if (value === '' || value == null) return false;
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 && number <= q.points;
};

//Lecturer/parents/admin: mark one student's submission. Auto-graded marks are filled in and can be changed;
//open-ended questions need a mark. Save Draft keeps the marking so far without the student seeing anything;
//Submit (after a confirmation) saves every mark and sends every new comment together.
const SubmissionGradingPage = () => {
    const { classData } = useOutletContext();
    const { attemptId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    //A student opens this page to see their own graded submission: everything is read-only for them.
    const readOnly = !STAFF_ROLES.includes(user?.role);

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [marks, setMarks] = useState({});       // questionId -> input value
    const [comments, setComments] = useState({}); // questionId -> html
    const [showErrors, setShowErrors] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);          // changes since the last draft save
    const [savingDraft, setSavingDraft] = useState(false);

    useEffect(() => {
        submissionService.getSubmission(classData.id, attemptId)
            .then((result) => {
                const { attempt, questions } = result.data;
                //Drafts are only for the first grading; a graded submission starts from its saved marks.
                const draft = attempt.status === 'graded' ? null : result.data.draft;
                setData(result.data);
                //A saved draft wins over the submitted marks, so the lecturer carries on where they stopped.
                setMarks(Object.fromEntries(questions.map((q) => {
                    const drafted = draft?.marks?.[q.id];
                    return [q.id, drafted !== undefined ? (drafted ?? '') : (q.pointsAwarded ?? '')];
                })));
                setComments(draft?.comments || {});
            })
            .catch((error) => {
                toast.error(error.error || "Failed to open this submission.");
                console.error(error);
                navigate(`/classes/${classData.id}/submission`);
            })
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [classData.id, attemptId]);

    //Warn before closing/refreshing the tab while there are changes since the last draft save.
    useEffect(() => {
        if (!dirty || saving) return;
        const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [dirty, saving]);

    if (loading || !data) {
        return <div className='flex justify-center py-12'><Spinner /></div>;
    }

    const { attempt, questions } = data;
    //Already graded: no drafts any more, and Submit becomes Update.
    const isGraded = attempt.status === 'graded';
    const invalidIds = questions.filter((q) => !isValidMark(q, marks[q.id])).map((q) => q.id);
    const total = questions.reduce((sum, q) => sum + q.points, 0);
    const score = questions.reduce((sum, q) => sum + (isValidMark(q, marks[q.id]) ? Number(marks[q.id] || 0) : 0), 0);
    const newComments = questions.filter((q) => hasText(comments[q.id])).length;

    const handleOpenSubmit = () => {
        if (invalidIds.length > 0) {
            setShowErrors(true);
            document.getElementById(`mark-${invalidIds[0]}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            toast.error("Some questions still need a mark.");
            return;
        }
        setConfirmOpen(true);
    };

    //The marks and new comments as the server expects them, for both Save Draft and Submit.
    //An empty box is sent as null (fine in a draft); a 0-point question is always 0.
    const buildPayload = () => ({
        marks: questions.map((q) => ({
            questionId: q.id,
            points: q.points === 0 ? 0 : (marks[q.id] === '' || marks[q.id] == null ? null : Number(marks[q.id]))
        })),
        comments: questions.filter((q) => hasText(comments[q.id])).map((q) => ({ questionId: q.id, content: comments[q.id] }))
    });

    const handleSaveDraft = async () => {
        //Empty boxes are fine in a draft, but a mark that's filled in must still be in range.
        const outOfRange = questions.filter((q) => marks[q.id] !== '' && marks[q.id] != null && !isValidMark(q, marks[q.id]));
        if (outOfRange.length > 0) {
            setShowErrors(true);
            document.getElementById(`mark-${outOfRange[0].id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            toast.error("A mark is outside the question's points.");
            return;
        }

        setSavingDraft(true);
        try {
            await submissionService.saveGradingDraft(classData.id, attemptId, buildPayload());
            setDirty(false);
            toast.success("Draft saved. Nothing has been sent to the student yet.");

        } catch (error) {
            toast.error(error.error || "Failed to save the draft.");
            console.error(error);

        } finally {
            setSavingDraft(false);
        }
    };

    const handleConfirm = async () => {
        setSaving(true);
        try {
            const result = await submissionService.gradeSubmission(classData.id, attemptId, buildPayload());
            setDirty(false);
            toast.success(isGraded ? "Marks updated successfully." : "Marks saved successfully.");
            if (result.data?.achievementEarned) {
                toast.success(`${attempt.studentName} earned this problem set's achievement!`, { icon: '🏆' });
            }
            //XP follows the score: the first grading adds it, a regrade only adds or removes the difference.
            const { xpGained, leveledUp, level } = result.data || {};
            if (xpGained) {
                const change = xpGained > 0 ? `gained ${xpGained} XP` : `lost ${-xpGained} XP`;
                toast.success(`${attempt.studentName} ${change}${leveledUp ? ` and reached level ${level}` : ''}.`, { icon: '⭐' });
            }
            setConfirmOpen(false);
            navigate(`/classes/${classData.id}/submission`);

        } catch (error) {
            toast.error(error.error || "Failed to save the marks.");
            console.error(error);

        } finally {
            setSaving(false);
        }
    };

    return (
        <div className='space-y-6'>
            <div className='flex flex-wrap items-center justify-between gap-4'>
                <div className='flex items-center gap-4'>
                    <div className='w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0'>
                        <ClipboardCheck className='w-7 h-7 text-purple-600' />
                    </div>
                    <div>
                        <h1 className='text-2xl font-bold text-slate-900'>{attempt.assessment}</h1>
                        <p className='text-sm text-slate-500'>
                            Submitted by <span className='text-purple-600 font-medium'>{attempt.studentName}</span> at {moment(attempt.submittedAt).format('D MMM YYYY HH:mm')}
                        </p>
                    </div>
                </div>
                <div className='flex flex-wrap items-center gap-3'>
                    <span className='text-sm text-slate-600'>Total: <strong>{formatPoints(score)} / {formatPoints(total)}</strong></span>
                    {!readOnly && !isGraded && (
                        <button
                            onClick={handleSaveDraft}
                            disabled={savingDraft || saving || !dirty}
                            className='flex items-center gap-2 border border-purple-300 text-purple-600 hover:bg-purple-50 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:hover:bg-transparent'
                        >
                            <Save className='w-4 h-4' /> {savingDraft ? 'Saving...' : 'Save Draft'}
                        </button>
                    )}
                    {!readOnly && (
                        <button
                            onClick={handleOpenSubmit}
                            className='px-8 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-base font-semibold transition-colors'
                        >
                            {isGraded ? 'Update' : 'Submit'}
                        </button>
                    )}
                </div>
            </div>

            <div className='max-w-4xl mx-auto space-y-10 pb-10'>
                {questions.map((q, index) => (
                    <GradeQuestionCard
                        key={q.id}
                        classId={classData.id}
                        setId={attempt.problemSetId}
                        readOnly={readOnly}
                        q={q}
                        number={index + 1}
                        mark={marks[q.id] ?? ''}
                        invalid={showErrors && invalidIds.includes(q.id)}
                        comment={comments[q.id] || ''}
                        onMarkChange={(value) => { setMarks((prev) => ({ ...prev, [q.id]: value })); setDirty(true); }}
                        onCommentChange={(value) => { setComments((prev) => ({ ...prev, [q.id]: value })); setDirty(true); }}
                    />
                ))}

                <GradingSummary attempt={attempt} questions={questions} marks={marks} score={score} total={total} />
            </div>

            <Modal isOpen={confirmOpen} onClose={() => !saving && setConfirmOpen(false)} title={isGraded ? 'Update Marks' : 'Submit Marks'}>
                <p className='text-sm text-slate-600 mb-4'>
                    {isGraded ? 'Update the marks to' : 'Save'} <strong>{formatPoints(score)} / {formatPoints(total)}</strong> for {attempt.studentName} on "{attempt.assessment}"
                    {newComments > 0 && ` and send ${newComments} comment${newComments > 1 ? 's' : ''}`}?
                </p>
                {isGraded && (
                    <div className='flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2.5 mb-4'>
                        <AlertTriangle className='w-4 h-4 shrink-0 mt-0.5' />
                        This submission was already graded. Your new marks will replace the old ones.
                    </div>
                )}
                <div className='flex gap-3'>
                    <button
                        onClick={() => setConfirmOpen(false)}
                        disabled={saving}
                        className='flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50'
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={saving}
                        className='flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white py-2 rounded-lg text-sm font-medium transition-colors'
                    >
                        {saving ? (isGraded ? 'Updating...' : 'Saving...') : (isGraded ? 'Update' : 'Confirm')}
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default SubmissionGradingPage;
