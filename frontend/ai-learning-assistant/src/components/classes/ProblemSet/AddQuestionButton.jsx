import React, { useState } from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import { QUESTION_TYPES } from './questionTypes';

//The main button adds a multiple choice question (the default); the arrow opens the menu of all three types.
const AddQuestionButton = ({ onAdd, adding }) => {
    const [open, setOpen] = useState(false);

    const add = (type) => {
        setOpen(false);
        onAdd(type);
    };

    return (
        <div className='relative'>
            <div className='flex bg-white border border-slate-200 rounded-2xl overflow-hidden'>
                <button
                    type='button'
                    onClick={() => add('mcq')}
                    disabled={adding}
                    className='flex-1 flex items-center justify-center gap-2 py-4 text-base font-medium text-purple-600 hover:bg-purple-50 transition-colors disabled:opacity-50'
                >
                    <Plus className='w-5 h-5' /> {adding ? 'Adding...' : 'Add Question'}
                </button>
                <button
                    type='button'
                    onClick={() => setOpen((prev) => !prev)}
                    disabled={adding}
                    aria-label='Choose a question type'
                    aria-expanded={open}
                    className='px-5 border-l border-slate-200 text-purple-600 hover:bg-purple-50 transition-colors disabled:opacity-50'
                >
                    <ChevronDown className={`w-5 h-5 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {open && (
                <>
                    <div className='fixed inset-0 z-10' onClick={() => setOpen(false)} />
                    <div className='absolute right-0 bottom-full mb-2 z-20 w-80 max-w-full bg-white border border-slate-200 rounded-xl shadow-lg p-1.5'>
                        {QUESTION_TYPES.map(({ value, label, hint, icon: Icon }) => (
                            <button
                                key={value}
                                type='button'
                                onClick={() => add(value)}
                                className='w-full flex items-start gap-3 p-3 rounded-lg text-left hover:bg-purple-50 transition-colors'
                            >
                                <div className='w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0'>
                                    <Icon className='w-4 h-4' />
                                </div>
                                <div>
                                    <p className='text-sm font-semibold text-slate-800'>{label}</p>
                                    <p className='text-xs text-slate-500'>{hint}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default AddQuestionButton;
