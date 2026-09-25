import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { HelpCircle, Plus, Trophy, Pencil, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import problemSetService from '../../services/ProblemSetService';
import Spinner from '../../components/common/Spinner';
import Modal from '../../components/common/Modal';
import QuestionEditor from '../../components/classes/ProblemSet/QuestionEditor';
import AchievementPanel from '../../components/classes/ProblemSet/AchievementPanel';
import { BASE_URL } from '../../utils/apiPath';

const ProblemSetBuilderPage = () => {
    const { classData } = useOutletContext();
    const { setId } = useParams();
    const navigate = useNavigate();

    const [set, setSet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null); // { type: 'question', id } | { type: 'achievement' } | null
    const [showAchievement, setShowAchievement] = useState(false);
    const [togglingAchievement, setTogglingAchievement] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [publishing, setPublishing] = useState(false);
    //null while showing the "are you sure" confirmation; an array once Confirm has found problems to show instead.
    const [publishIssues, setPublishIssues] = useState(null);
    const [editingTitle, setEditingTitle] = useState(false);
    const [titleDraft, setTitleDraft] = useState('');
    const [savingTitle, setSavingTitle] = useState(false);

    //keepSelection = true while the lecturer is mid-edit (adding a question, saving), so the panel doesn't jump around.
    const fetchSet = async (keepSelection = true) => {
        try {
            const result = await problemSetService.getProblemSet(classData.id, setId);
            setSet(result.data);
            setShowAchievement((prev) => keepSelection ? (prev || !!result.data.achievement) : !!result.data.achievement);
            return result.data;

        } catch (error) {
            toast.error(error.error || "Failed to open this problem set.");
            navigate(`/classes/${classData.id}/problem-sets`);
            return null;

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSet(false).then((data) => {
            if (data?.questions?.[0]) setSelected({ type: 'question', id: data.questions[0].id });
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setId]);

    const startEditingTitle = () => {
        setTitleDraft(set.title);
        setEditingTitle(true);
    };

    const handleSaveTitle = async () => {
        const title = titleDraft.trim();
        if (!title) {
            toast.error("Title is required.");
            return;
        }
        if (title === set.title) {
            setEditingTitle(false);
            return;
        }

        setSavingTitle(true);
        try {
            await problemSetService.updateTitle(classData.id, setId, title);
            setSet((prev) => ({ ...prev, title }));
            setEditingTitle(false);

        } catch (error) {
            toast.error(error.error || "Failed to rename the problem set.");
            console.error(error);

        } finally {
            setSavingTitle(false);
        }
    };

    const handleAddQuestion = async () => {
        try {
            const result = await problemSetService.addQuestion(classData.id, setId);
            await fetchSet();
            setSelected({ type: 'question', id: result.data.id });

        } catch (error) {
            toast.error(error.error || "Failed to add the question.");
            console.error(error);
        }
    };

    //Turning the achievement ON creates a blank row on the server right away, so it autosaves from the first
    //keystroke and survives a refresh. Turning it OFF deletes that row.
    const handleAchievementToggle = async () => {
        setTogglingAchievement(true);
        try {
            if (showAchievement) {
                await problemSetService.removeAchievement(classData.id, setId);
                toast.success("Achievement removed.");
                setShowAchievement(false);
                setSelected(set.questions[0] ? { type: 'question', id: set.questions[0].id } : null);
                await fetchSet();

            } else {
                await problemSetService.createAchievementDraft(classData.id, setId);
                await fetchSet();
                setShowAchievement(true);
                setSelected({ type: 'achievement' });
            }

        } catch (error) {
            toast.error(error.error || "Failed to update the achievement.");
            console.error(error);

        } finally {
            setTogglingAchievement(false);
        }
    };

    //Publish always opens the confirmation first; every check happens only once Confirm is actually clicked.
    const handleOpenPublish = () => {
        setPublishIssues(null);
        setConfirmOpen(true);
    };

    const handleClosePublish = () => {
        setConfirmOpen(false);
        setPublishIssues(null);
    };

    const handlePublish = async () => {
        setPublishing(true);
        try {
            //The achievement (like every question) has already been autosaving to the server all along, so
            //publish only needs to re-check completeness, not write anything itself.
            await problemSetService.publishProblemSet(classData.id, setId);
            toast.success("Problem set published successfully.");
            setConfirmOpen(false);
            fetchSet();

        } catch (error) {
            if (Array.isArray(error.data?.issues)) {
                setPublishIssues(error.data.issues);
            } else {
                toast.error(error.error || "Failed to publish the problem set.");
            }
            console.error(error);

        } finally {
            setPublishing(false);
        }
    };

    if (loading || !set) {
        return <div className='flex justify-center py-12'><Spinner /></div>;
    }

    const totalPoints = set.questions.reduce((sum, q) => sum + (q.points || 0), 0);
    const achievement = set.achievement;

    return (
        <div className='space-y-6'>
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                    <HelpCircle className='w-9 h-9 text-slate-700' strokeWidth={2} />
                    <div>
                        {editingTitle ? (
                            <input
                                autoFocus
                                value={titleDraft}
                                onChange={(e) => setTitleDraft(e.target.value)}
                                onBlur={handleSaveTitle}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') e.currentTarget.blur();
                                    if (e.key === 'Escape') setEditingTitle(false);
                                }}
                                disabled={savingTitle}
                                maxLength={255}
                                className='text-lg font-bold text-slate-900 border-b-2 border-purple-400 focus:outline-none disabled:opacity-60'
                            />
                        ) : (
                            <button
                                onClick={startEditingTitle}
                                className='group flex items-center gap-2 text-left'
                                aria-label='Rename problem set'
                            >
                                <h2 className='text-lg font-bold text-slate-900'>{set.title}</h2>
                                <Pencil className='w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity' />
                            </button>
                        )}
                        <p className='text-xs text-slate-400'>
                            Created by {set.author_name} &bull;
                        </p>
                    </div>
                </div>
                {set.status === 'draft' && (
                    <button
                        onClick={handleOpenPublish}
                        className='bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors'
                    >
                        Publish
                    </button>
                )}
            </div>

            <div className='flex gap-5 items-start'>
                {/* Left rail */}
                <div className='w-60 shrink-0 bg-white border border-slate-200 rounded-2xl p-4 space-y-4'>
                    <div>
                        <div className='flex items-center justify-between mb-2'>
                            <span className='text-sm font-medium text-slate-700'>Achievement</span>
                            <button
                                onClick={handleAchievementToggle}
                                disabled={togglingAchievement}
                                className={`w-11 h-6 rounded-full relative transition-colors disabled:opacity-50 ${showAchievement ? 'bg-purple-600' : 'bg-slate-300'}`}
                                aria-label='Toggle achievement'
                            >
                                <span className={`absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${showAchievement ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                        {showAchievement && achievement && (
                            <button
                                onClick={() => setSelected({ type: 'achievement' })}
                                className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-colors ${
                                    selected?.type === 'achievement' ? 'border-purple-400 bg-purple-50' : 'border-slate-200 hover:border-purple-200'}`}
                            >
                                {achievement.badge_image ? (
                                    <img
                                        src={`${BASE_URL}/uploads/problem-set-badges/${achievement.badge_image}`}
                                        alt=''
                                        className='w-9 h-9 rounded-full object-cover shrink-0'
                                    />
                                ) : (
                                    <div className='w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center shrink-0'>
                                        <Trophy className='w-4 h-4 text-purple-400' />
                                    </div>
                                )}
                                <div className='min-w-0'>
                                    <p className='text-sm font-semibold truncate'>{achievement.title || 'Untitled Badge'}</p>
                                    <p className='text-xs text-slate-400'>{achievement.min_points ?? 0} out of {totalPoints} points</p>
                                </div>
                            </button>
                        )}
                    </div>

                    <div className='border-t border-slate-200 pt-4'>
                        <div className='flex items-center justify-between mb-2'>
                            <span className='text-xs font-bold text-slate-400'>PROBLEMS LIST</span>
                            <span className='text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full'>{set.questions.length} Total</span>
                        </div>
                        <div className='space-y-1.5'>
                            {set.questions.map((q, index) => {
                                const active = selected?.type === 'question' && selected.id === q.id;
                                return (
                                    <button
                                        key={q.id}
                                        onClick={() => setSelected({ type: 'question', id: q.id })}
                                        className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-colors ${
                                            active
                                                ? 'bg-linear-to-r from-purple-500 to-purple-600 border-transparent text-white'
                                                : 'border-slate-200 text-slate-700 hover:border-purple-200'}`}
                                    >
                                        <span className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${active ? 'bg-white/25' : 'bg-slate-100'}`}>
                                            {index + 1}
                                        </span>
                                        <div className='min-w-0'>
                                            <p className='text-sm font-semibold truncate'>{q.title || 'Untitled Question'}</p>
                                            <p className={`text-xs ${active ? 'text-purple-100' : 'text-slate-400'}`}>
                                                {q.points ?? '—'} Points
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                            <button
                                onClick={handleAddQuestion}
                                className='w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-200 text-sm font-medium text-purple-600 hover:bg-purple-50 transition-colors'
                            >
                                <Plus className='w-4 h-4' /> Add Question
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main panel */}
                <div className='flex-1 bg-white border border-slate-200 rounded-2xl overflow-hidden'>
                    {selected?.type === 'achievement' ? (
                        <AchievementPanel
                            classId={classData.id}
                            setId={setId}
                            achievement={achievement}
                            totalPoints={totalPoints}
                            onSaved={fetchSet}
                        />
                    ) : selected?.type === 'question' && set.questions.find((q) => q.id === selected.id) ? (
                        <QuestionEditor
                            key={selected.id}
                            classId={classData.id}
                            setId={setId}
                            question={set.questions.find((q) => q.id === selected.id)}
                            questionNumber={set.questions.findIndex((q) => q.id === selected.id) + 1}
                            requirePoints={showAchievement}
                            onSaved={fetchSet}
                            onDeleted={async () => {
                                const data = await fetchSet();
                                setSelected(data?.questions?.[0] ? { type: 'question', id: data.questions[0].id } : null);
                            }}
                        />
                    ) : (
                        <div className='flex flex-col items-center justify-center py-24 text-center text-slate-400'>
                            <Trophy className='w-10 h-10 mb-3' />
                            <p className='text-sm'>Add a question to get started.</p>
                        </div>
                    )}
                </div>
            </div>

            <Modal
                isOpen={confirmOpen}
                onClose={handleClosePublish}
                title={publishIssues ? 'Cannot Publish Yet' : 'Publish Problem Set'}
            >
                {publishIssues ? (
                    <>
                        <p className='text-sm text-slate-600 mb-4'>Fix the following before publishing:</p>
                        <ul className='space-y-2 mb-6 max-h-72 overflow-y-auto'>
                            {publishIssues.map((issue, index) => (
                                <li key={index} className='flex items-start gap-2.5 text-sm bg-red-50 border border-red-100 rounded-lg px-3 py-2.5'>
                                    <AlertCircle className='w-4 h-4 text-red-500 shrink-0 mt-0.5' />
                                    <span className='text-slate-700'>
                                        {issue.questionTitle && (
                                            <span className='font-semibold'>Q{issue.questionNumber} &ldquo;{issue.questionTitle}&rdquo;: </span>
                                        )}
                                        {issue.message}
                                    </span>
                                </li>
                            ))}
                        </ul>
                        <button
                            onClick={handleClosePublish}
                            className='w-full border border-slate-200 text-slate-600 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors'
                        >
                            Close
                        </button>
                    </>
                ) : (
                    <>
                        <p className='text-sm text-slate-600 mb-6'>
                            Once published, students in this class will be able to see "{set.title}". Are you sure you want to publish it?
                        </p>
                        <div className='flex gap-3'>
                            <button
                                onClick={handleClosePublish}
                                disabled={publishing}
                                className='flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50'
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePublish}
                                disabled={publishing}
                                className='flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white py-2 rounded-lg text-sm font-medium transition-colors'
                            >
                                {publishing ? 'Publishing...' : 'Confirm'}
                            </button>
                        </div>
                    </>
                )}
            </Modal>
        </div>
    );
};

export default ProblemSetBuilderPage;
