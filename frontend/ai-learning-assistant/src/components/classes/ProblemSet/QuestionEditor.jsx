import React, { useState, useEffect, useRef } from 'react';
import { Pencil, Eye, Trash2, Plus, X, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import problemSetService from '../../../services/ProblemSetService';
import RichTextEditor from '../RichTextEditor';

const emptyOptions = () => [{ text: '', isCorrect: true }];
//Same text without any tags, so an empty "<p></p>" from the rich text editor doesn't count as a real description.
const toPlainText = (html) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

//Editor / Student Preview for one question. requirePoints is true while the set has an achievement.
const QuestionEditor = ({ classId, setId, question, questionNumber, requirePoints, onSaved, onDeleted }) => {
    const [tab, setTab] = useState('edit');
    const [title, setTitle] = useState(question.title);
    const [points, setPoints] = useState(question.points ?? '');
    const [description, setDescription] = useState(question.description || '');
    const [options, setOptions] = useState(
        question.options.length ? question.options.map((o) => ({ text: o.option_text, isCorrect: o.is_correct })) : emptyOptions()
    );
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    //Stops the debounced autosave from firing after the question has been deleted, or after switching to another question.
    const aliveRef = useRef(true);

    //Reset local state whenever a different question is selected.
    useEffect(() => {
        aliveRef.current = true;
        setTab('edit');
        setTitle(question.title);
        setPoints(question.points ?? '');
        setDescription(question.description || '');
        setOptions(question.options.length ? question.options.map((o) => ({ text: o.option_text, isCorrect: o.is_correct })) : emptyOptions());

        return () => { aliveRef.current = false; };
    }, [question.id]);

    //Autosaves shortly after the lecturer stops typing.
    useEffect(() => {
        if (!title.trim()) return; //don't save an empty title while it's still being typed

        const timeout = setTimeout(() => { handleSave(); }, 700);
        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [title, points, description, JSON.stringify(options)]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await problemSetService.updateQuestion(classId, setId, question.id, {
                title: title.trim(),
                description,
                points: points === '' ? null : Number(points),
                options: options.filter((o) => o.text.trim())
            });
            if (aliveRef.current) onSaved();

        } catch (error) {
            if (aliveRef.current) toast.error(error.error || "Failed to save the question.");
            console.error(error);

        } finally {
            if (aliveRef.current) setSaving(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        aliveRef.current = false; //stop any pending autosave from firing after this question is gone
        try {
            await problemSetService.deleteQuestion(classId, setId, question.id);
            toast.success("Question deleted successfully.");
            onDeleted();

        } catch (error) {
            aliveRef.current = true;
            toast.error(error.error || "Failed to delete the question.");
            console.error(error);

        } finally {
            setDeleting(false);
        }
    };

    const updateOption = (index, patch) => setOptions((prev) => prev.map((o, i) => i === index ? { ...o, ...patch } : o));
    const markCorrect = (index) => setOptions((prev) => prev.map((o, i) => ({ ...o, isCorrect: i === index })));
    const removeOption = (index) => setOptions((prev) => prev.filter((_, i) => i !== index));
    const addOption = () => setOptions((prev) => [...prev, { text: '', isCorrect: false }]);

    const filledOptions = options.filter((o) => o.text.trim());
    const hasDescription = !!toPlainText(description) || description.includes('<img');
    const descriptionNeedsMoreOptions = hasDescription && filledOptions.length <= 1;

    return (
        <div>
            <div className='flex items-center justify-between px-6 py-4 border-b border-slate-100'>
                <div className='flex items-center gap-2'>
                    <span className='text-sm font-bold text-purple-600'>Q{questionNumber}</span>
                    <span className='text-base font-bold text-slate-900'>Multiple Choice Question</span>
                </div>
                <div className='flex items-center gap-3'>
                    {saving && <span className='text-xs text-slate-400'>Saving...</span>}
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className='p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all disabled:opacity-50'
                        aria-label='Delete question'
                    >
                        <Trash2 className='w-4 h-4' />
                    </button>
                </div>
            </div>

            <div className='flex gap-6 px-6 border-b border-slate-200'>
                <button
                    onClick={() => setTab('edit')}
                    className={`flex items-center gap-1.5 py-3 text-sm font-bold border-b-2 transition-colors ${
                        tab === 'edit' ? 'text-purple-600 border-purple-600' : 'text-slate-400 border-transparent'}`}
                >
                    <Pencil className='w-4 h-4' /> Editor
                </button>
                <button
                    onClick={() => setTab('preview')}
                    className={`flex items-center gap-1.5 py-3 text-sm font-bold border-b-2 transition-colors ${
                        tab === 'preview' ? 'text-purple-600 border-purple-600' : 'text-slate-400 border-transparent'}`}
                >
                    <Eye className='w-4 h-4' /> Student Preview
                </button>
            </div>

            {tab === 'edit' ? (
                <div className='p-6 space-y-5'>
                    <div className='flex gap-4'>
                        {requirePoints && (
                            <div className='w-48'>
                                <label className='text-sm font-medium text-slate-700 mb-1.5 block'>
                                    Number of Points<span className='text-red-500'> *</span>
                                </label>
                                <input
                                    type='number'
                                    min='0'
                                    value={points}
                                    onChange={(e) => setPoints(e.target.value)}
                                    className='w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400'
                                />
                            </div>
                        )}
                    </div>

                    <div>
                        <label className='text-sm font-medium text-slate-700 mb-1.5 block'>Description (optional)</label>
                        <RichTextEditor
                            classId={classId}
                            value={description}
                            onChange={setDescription}
                            uploadImage={(file) => problemSetService.uploadQuestionImage(classId, setId, file)}
                        />
                        {descriptionNeedsMoreOptions && (
                            <p className='text-xs text-amber-600 mt-1.5'>A description needs more than one answer option below.</p>
                        )}
                    </div>

                    <div>
                        <span className='text-xs font-bold text-slate-400 mb-2 block'>ANSWER OPTIONS</span>
                        <div className='space-y-2'>
                            {options.map((opt, index) => (
                                <div
                                    key={index}
                                    className={`flex items-center gap-3 border rounded-xl px-4 py-2.5 ${
                                        opt.isCorrect ? 'border-purple-300 bg-purple-50/50' : 'border-slate-200'}`}
                                >
                                    <button
                                        onClick={() => markCorrect(index)}
                                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                                            opt.isCorrect ? 'bg-purple-500 text-white' : 'border-2 border-slate-300'}`}
                                        aria-label='Mark as correct'
                                    >
                                        {opt.isCorrect && <CheckCircle2 className='w-4 h-4' />}
                                    </button>
                                    <input
                                        value={opt.text}
                                        onChange={(e) => updateOption(index, { text: e.target.value })}
                                        placeholder='Answer option...'
                                        className='flex-1 text-sm bg-transparent focus:outline-none'
                                    />
                                    {opt.isCorrect && <span className='text-xs font-semibold text-purple-600'>Correct</span>}
                                    <button
                                        onClick={() => removeOption(index)}
                                        disabled={options.length <= 1}
                                        className='text-slate-300 hover:text-red-500 disabled:opacity-30 disabled:hover:text-slate-300'
                                        aria-label='Remove option'
                                    >
                                        <X className='w-4 h-4' />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={addOption}
                                className='w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-slate-300 text-sm text-slate-500 hover:border-purple-300 hover:text-purple-600 transition-colors'
                            >
                                <Plus className='w-4 h-4' /> Add custom answer option
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className='p-6'>
                    <p className='text-xs font-semibold text-purple-600 bg-purple-50 inline-block px-3 py-1 rounded-full mb-4'>Question {questionNumber}</p>
                    <p className='text-lg text-slate-900 mb-2'>{title || 'Untitled Question'}</p>
                    {/* The backend sanitizes this HTML before saving, so it is safe to render */}
                    {hasDescription && (
                        <div className='rich-content text-sm text-slate-600 mb-5' dangerouslySetInnerHTML={{ __html: description }} />
                    )}
                    <div className='space-y-2.5'>
                        {filledOptions.length === 0 ? (
                            <p className='text-sm text-slate-400'>No answer options added yet.</p>
                        ) : filledOptions.map((opt, index) => (
                            <div key={index} className='flex items-center gap-3 border border-slate-200 rounded-xl px-4 py-3.5'>
                                <span className='w-4 h-4 rounded-full border-2 border-slate-300 shrink-0' />
                                <span className='text-sm text-slate-700'>{opt.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuestionEditor;
