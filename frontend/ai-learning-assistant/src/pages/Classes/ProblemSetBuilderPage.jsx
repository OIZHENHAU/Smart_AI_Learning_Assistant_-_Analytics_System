import React, { useState, useEffect, useRef } from 'react';
import { Navigate, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { HelpCircle, Pencil, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import problemSetService from '../../services/ProblemSetService';
import Spinner from '../../components/common/Spinner';
import Modal from '../../components/common/Modal';
import AchievementPanel from '../../components/classes/ProblemSet/AchievementPanel';
import QuestionCard from '../../components/classes/ProblemSet/QuestionCard';
import AddQuestionButton from '../../components/classes/ProblemSet/AddQuestionButton';
import { getPublishIssues } from '../../components/classes/ProblemSet/publishChecks';
import { getQuestionType } from '../../components/classes/ProblemSet/questionTypes';
import { BASE_URL } from '../../utils/apiPath';
import { useAuth } from '../../context/AuthContext';

const blankOptions = (type) => type === 'mcq' ? [{ text: '', isCorrect: true }] : [];

//The server's question/achievement turned into the shape the editors work with.
const toQuestionDraft = (q) => {
    const type = q.type || 'mcq';
    return {
        type,
        title: q.title,
        points: q.points ?? '',
        description: q.description || '',
        options: type === 'mcq' && q.options.length
            ? q.options.map((o) => ({ text: o.option_text, isCorrect: o.is_correct }))
            : blankOptions(type)
    };
};

const toAchievementDraft = (a) => ({
    title: a?.title || '',
    description: a?.description || '',
    minPoints: a?.min_points ?? '',
    expiryDate: a?.expiry_date ? a.expiry_date.slice(0, 10) : '',
    imageFile: null,
    imagePreviewUrl: a?.badge_image ? `${BASE_URL}/uploads/problem-set-badges/${a.badge_image}` : null
});

//Builder for lecturer/parents/admin only. A student who types this URL is sent to the attempt page instead,
//because the builder shows the answers. Everything is on one page: the achievement card, then every question card.
//Nothing autosaves (except attached files): edits stay here until Save as Draft, or Publish.
const ProblemSetBuilderPage = () => {
    const { classData } = useOutletContext();
    const { setId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isStudent = user?.role === 'student';

    const [set, setSet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAchievement, setShowAchievement] = useState(false);
    //Unsaved edits. Only questions that were actually edited have an entry; achievementDraft stays null until edited.
    const [questionDrafts, setQuestionDrafts] = useState({});
    const [achievementDraft, setAchievementDraft] = useState(null);
    const [addingQuestion, setAddingQuestion] = useState(false);
    const [savingDraft, setSavingDraft] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [publishing, setPublishing] = useState(false);
    //null while showing the "are you sure" confirmation; an array once Confirm has found problems to show instead.
    const [publishIssues, setPublishIssues] = useState(null);
    //Turned on by a failed publish: from then on every card re-checks itself live and highlights what's still wrong.
    const [showIssues, setShowIssues] = useState(false);
    const [scrollTarget, setScrollTarget] = useState(null); // question id | 'achievement'
    const [editingTitle, setEditingTitle] = useState(false);
    const [titleDraft, setTitleDraft] = useState('');
    const [savingTitle, setSavingTitle] = useState(false);

    const achievementRef = useRef(null);
    const cardRefs = useRef({});

    //initial = true only on first load; after that the achievement switch is the lecturer's own (maybe unsaved) choice.
    const fetchSet = async (initial = false) => {
        try {
            const result = await problemSetService.getProblemSet(classData.id, setId);
            setSet(result.data);
            if (initial) setShowAchievement(!!result.data.achievement);
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
        if (isStudent) return; //a student never needs this data; they're redirected to the attempt page below
        fetchSet(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setId, isStudent]);

    //Scrolls once the card being scrolled to has actually rendered (e.g. a question that was just added).
    useEffect(() => {
        if (scrollTarget == null) return;
        const el = scrollTarget === 'achievement' ? achievementRef.current : cardRefs.current[scrollTarget];
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setScrollTarget(null);
    }, [scrollTarget, set]);

    const hasUnsavedChanges = !!set && (
        Object.keys(questionDrafts).length > 0 || !!achievementDraft || showAchievement !== !!set.achievement
    );

    //Warn before closing/refreshing the tab while there are edits that haven't been saved yet.
    useEffect(() => {
        if (!hasUnsavedChanges) return;
        const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [hasUnsavedChanges]);

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

    const handleAddQuestion = async (type) => {
        setAddingQuestion(true);
        try {
            const result = await problemSetService.addQuestion(classData.id, setId, type);
            await fetchSet();
            setScrollTarget(result.data.id);

        } catch (error) {
            toast.error(error.error || "Failed to add the question.");
            console.error(error);

        } finally {
            setAddingQuestion(false);
        }
    };

    const updateQuestionDraft = (question, patch) => setQuestionDrafts((prev) => ({
        ...prev,
        [question.id]: { ...(prev[question.id] || toQuestionDraft(question)), ...patch }
    }));

    const updateAchievementDraft = (patch) => setAchievementDraft((prev) => ({
        ...(prev || toAchievementDraft(set.achievement)), ...patch
    }));

    //Switching the achievement off hides every points field AND clears its value, so no points are saved.
    //The achievement itself is only created or removed on the server when the set is saved.
    const handleAchievementToggle = () => {
        if (!showAchievement) {
            setShowAchievement(true);
            return;
        }

        setShowAchievement(false);
        setQuestionDrafts((prev) => {
            const next = { ...prev };
            for (const q of set.questions) {
                const current = next[q.id] || toQuestionDraft(q);
                if (current.points !== '') next[q.id] = { ...current, points: '' };
            }
            return next;
        });
    };

    //A new type starts with fresh answers. The title follows the type unless the lecturer renamed it.
    const handleTypeChange = (question, type) => {
        const current = questionDrafts[question.id] || toQuestionDraft(question);
        if (current.type === type) return;

        const keepTitle = current.title.trim() && current.title !== getQuestionType(current.type).title;
        updateQuestionDraft(question, {
            type,
            title: keepTitle ? current.title : getQuestionType(type).title,
            options: blankOptions(type)
        });
    };

    //Attached files are already saved on the server, so only the loaded copy needs updating.
    const handleFilesChange = (questionId, files) => setSet((prev) => ({
        ...prev,
        questions: prev.questions.map((q) => q.id === questionId ? { ...q, files } : q)
    }));

    const handleQuestionDeleted = async (questionId) => {
        setQuestionDrafts((prev) => {
            const next = { ...prev };
            delete next[questionId];
            return next;
        });
        await fetchSet();
    };

    //Writes every unsaved edit to the database. The set's status is left alone, so a draft stays a draft.
    const saveChanges = async () => {
        for (const [questionId, draft] of Object.entries(questionDrafts)) {
            await problemSetService.updateQuestion(classData.id, setId, questionId, {
                type: draft.type,
                title: draft.title.trim(),
                description: draft.description,
                points: draft.points === '' ? null : Number(draft.points),
                //Fill-in-the-blank answers are read out of the passage by the server; open-ended has none.
                options: draft.type === 'mcq' ? draft.options.filter((o) => o.text.trim()) : []
            });
        }

        if (showAchievement && (achievementDraft || !set.achievement)) {
            const achievementValue = achievementDraft || toAchievementDraft(set.achievement);
            const formData = new FormData();
            if (achievementValue.imageFile) formData.append('badgeImage', achievementValue.imageFile);
            formData.append('title', achievementValue.title.trim());
            formData.append('description', achievementValue.description.trim());
            formData.append('minPoints', achievementValue.minPoints);
            formData.append('expiryDate', achievementValue.expiryDate);
            await problemSetService.saveAchievement(classData.id, setId, formData);

        } else if (!showAchievement && set.achievement) {
            await problemSetService.removeAchievement(classData.id, setId);
        }

        setQuestionDrafts({});
        setAchievementDraft(null);
        await fetchSet();
    };

    const handleSaveDraft = async () => {
        setSavingDraft(true);
        try {
            await saveChanges();
            toast.success(set.status === 'draft' ? "Saved as draft." : "Changes saved.");
            setConfirmOpen(false);
            setPublishIssues(null);

        } catch (error) {
            toast.error(error.error || "Failed to save the problem set.");
            console.error(error);

        } finally {
            setSavingDraft(false);
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

    //What the cards currently show: the unsaved edit when there is one, otherwise what's on the server.
    const currentQuestions = (set?.questions || []).map((q) => ({ id: q.id, files: q.files || [], ...(questionDrafts[q.id] || toQuestionDraft(q)) }));
    const currentAchievement = achievementDraft || toAchievementDraft(set?.achievement);
    const liveIssues = showIssues ? getPublishIssues(currentQuestions, showAchievement ? currentAchievement : null) : [];

    //Closes the popup and brings the lecturer to the card that needs fixing.
    const goToIssue = (issue) => {
        handleClosePublish();
        if (issue?.scope === 'achievement') setScrollTarget('achievement');
        else if (issue?.questionId != null) setScrollTarget(issue.questionId);
    };

    //Confirm: check the conditions first. If any aren't met, nothing is saved; the popup lists them, the failing
    //cards turn red, and Save as Draft is offered instead. Only when everything passes is the set published.
    const handlePublish = async () => {
        const issues = getPublishIssues(currentQuestions, showAchievement ? currentAchievement : null);
        if (issues.length > 0) {
            setPublishIssues(issues);
            setShowIssues(true);
            return;
        }

        setPublishing(true);
        try {
            await saveChanges();
            await problemSetService.publishProblemSet(classData.id, setId);
            toast.success("Problem set published successfully.");
            setConfirmOpen(false);
            setShowIssues(false);
            fetchSet();

        } catch (error) {
            //The backend re-checks everything, so it can still refuse here (the edits are already saved by then).
            if (Array.isArray(error.data?.issues)) {
                setPublishIssues(error.data.issues);
                setShowIssues(true);
            } else {
                toast.error(error.error || "Failed to publish the problem set.");
            }
            console.error(error);

        } finally {
            setPublishing(false);
        }
    };

    if (isStudent) {
        return <Navigate to={`/classes/${classData.id}/problem-sets/${setId}/attempt`} replace />;
    }

    if (loading || !set) {
        return <div className='flex justify-center py-12'><Spinner /></div>;
    }

    const totalPoints = currentQuestions.reduce((sum, q) => sum + (Number(q.points) || 0), 0);

    return (
        <div className='space-y-6'>
            {/* Header stays visible while the cards scroll underneath it */}
            <div className='sticky top-0 z-20 py-3 bg-slate-50/95 backdrop-blur flex flex-wrap items-center justify-between gap-3'>
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
                                className='text-lg font-bold text-slate-900 border-b-2 border-purple-400 bg-transparent focus:outline-none disabled:opacity-60'
                            />
                        ) : (
                            <button onClick={startEditingTitle} className='group flex items-center gap-2 text-left' aria-label='Rename problem set'>
                                <h2 className='text-lg font-bold text-slate-900'>{set.title}</h2>
                                <Pencil className='w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors' />
                            </button>
                        )}
                        <p className='text-xs text-slate-400'>
                            Created by {set.author_name} &bull; {set.status === 'draft' ? 'Draft' : 'Published'}
                        </p>
                    </div>
                </div>
                <div className='flex items-center gap-3'>
                    {hasUnsavedChanges && <span className='text-xs text-amber-600'>Unsaved changes</span>}
                    <button
                        onClick={handleSaveDraft}
                        disabled={savingDraft || !hasUnsavedChanges}
                        className='border border-purple-300 text-purple-600 hover:bg-purple-50 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:hover:bg-transparent'
                    >
                        {savingDraft ? 'Saving...' : set.status === 'draft' ? 'Save as Draft' : 'Save Changes'}
                    </button>
                    {set.status === 'draft' && (
                        <button
                            onClick={handleOpenPublish}
                            className='bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors'
                        >
                            Publish
                        </button>
                    )}
                </div>
            </div>

            <div className='max-w-5xl mx-auto space-y-5 pb-10'>
                <div ref={achievementRef} className='scroll-mt-28'>
                    <AchievementPanel
                        enabled={showAchievement}
                        onToggle={handleAchievementToggle}
                        value={currentAchievement}
                        totalPoints={totalPoints}
                        onChange={updateAchievementDraft}
                        issues={liveIssues.filter((i) => i.scope === 'achievement').map((i) => i.message)}
                    />
                </div>

                {currentQuestions.map((q, index) => {
                    const question = set.questions[index];
                    return (
                        <div
                            key={q.id}
                            ref={(el) => { if (el) cardRefs.current[q.id] = el; else delete cardRefs.current[q.id]; }}
                            className='scroll-mt-28'
                        >
                            <QuestionCard
                                classId={classData.id}
                                setId={setId}
                                question={question}
                                value={q}
                                questionNumber={index + 1}
                                showPoints={showAchievement}
                                issues={liveIssues.filter((i) => i.questionId === q.id).map((i) => i.message)}
                                onChange={(patch) => updateQuestionDraft(question, patch)}
                                onTypeChange={(type) => handleTypeChange(question, type)}
                                onFilesChange={(files) => handleFilesChange(q.id, files)}
                                onDeleted={() => handleQuestionDeleted(q.id)}
                            />
                        </div>
                    );
                })}

                <AddQuestionButton onAdd={handleAddQuestion} adding={addingQuestion} />
            </div>

            <Modal
                isOpen={confirmOpen}
                onClose={handleClosePublish}
                title={publishIssues ? 'Some Conditions Are Not Met' : 'Publish Problem Set'}
            >
                {publishIssues ? (
                    <>
                        <p className='text-sm text-slate-600 mb-4'>This problem set can't be published until the following are fixed. Click one to jump to it.</p>
                        <ul className='space-y-2 mb-4 max-h-72 overflow-y-auto'>
                            {publishIssues.map((issue, index) => (
                                <li key={index}>
                                    <button
                                        onClick={() => goToIssue(issue)}
                                        className='w-full flex items-start gap-2.5 text-left text-sm bg-red-50 border border-red-100 rounded-lg px-3 py-2.5 hover:border-red-300 transition-colors'
                                    >
                                        <AlertCircle className='w-4 h-4 text-red-500 shrink-0 mt-0.5' />
                                        <span className='text-slate-700'>
                                            {issue.questionTitle && (
                                                <span className='font-semibold'>Q{issue.questionNumber} &ldquo;{issue.questionTitle}&rdquo;: </span>
                                            )}
                                            {issue.scope === 'achievement' && <span className='font-semibold'>Achievement: </span>}
                                            {issue.message}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <p className='text-sm text-slate-600 mb-6'>Would you like to save it as a draft for now?</p>
                        <div className='flex gap-3'>
                            <button
                                onClick={() => goToIssue(publishIssues[0])}
                                disabled={savingDraft}
                                className='flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50'
                            >
                                Keep Editing
                            </button>
                            <button
                                onClick={handleSaveDraft}
                                disabled={savingDraft || !hasUnsavedChanges}
                                className='flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white py-2 rounded-lg text-sm font-medium transition-colors'
                            >
                                {savingDraft ? 'Saving...' : 'Save as Draft'}
                            </button>
                        </div>
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
