import React from 'react';
import { Plus, X, CheckCircle2 } from 'lucide-react';
import problemSetService from '../../../services/ProblemSetService';
import RichTextEditor from '../RichTextEditor';
import { hasDescription } from './publishChecks';

const MultipleChoiceEditor = ({ classId, setId, description, options, onChange }) => {
    const setOptions = (update) => onChange({ options: update(options) });

    const updateOption = (index, patch) => setOptions((prev) => prev.map((o, i) => i === index ? { ...o, ...patch } : o));
    const markCorrect = (index) => setOptions((prev) => prev.map((o, i) => ({ ...o, isCorrect: i === index })));
    const removeOption = (index) => setOptions((prev) => prev.filter((_, i) => i !== index));
    const addOption = () => setOptions((prev) => [...prev, { text: '', isCorrect: false }]);

    const filledOptions = options.filter((o) => o.text.trim());
    const descriptionNeedsMoreOptions = hasDescription(description) && filledOptions.length <= 1;

    return (
        <div className='space-y-5'>
            <div>
                <label className='text-sm font-medium text-slate-700 mb-1.5 block'>Description (optional)</label>
                <RichTextEditor
                    classId={classId}
                    value={description}
                    onChange={(next) => onChange({ description: next })}
                    uploadImage={(file) => problemSetService.uploadQuestionImage(classId, setId, file)}
                />
                {descriptionNeedsMoreOptions && (
                    <p className='text-xs text-amber-600 mt-1.5'>A description needs more than one answer option below.</p>
                )}
            </div>

            <div>
                <span className='text-xs font-bold text-slate-400 tracking-wide mb-2 block'>ANSWER OPTIONS</span>
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
                                maxLength={500}
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
    );
};

export default MultipleChoiceEditor;
