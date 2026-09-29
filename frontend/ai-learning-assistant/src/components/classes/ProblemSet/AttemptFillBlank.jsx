import React, { useState } from 'react';
import BlankPassage from './BlankPassage';

const AttemptFillBlank = ({ question, fills, onChange }) => {
    const [active, setActive] = useState(() => Math.max(0, fills.findIndex((f) => f == null)));
    const used = new Set(fills.filter((f) => f != null));

    const placeWord = (wordIndex) => {
        const target = fills[active] == null ? active : fills.findIndex((f) => f == null);
        if (target === -1) return;

        const next = [...fills];
        next[target] = wordIndex;
        onChange(next);

        const nextEmpty = next.findIndex((f) => f == null);
        if (nextEmpty !== -1) setActive(nextEmpty);
    };

    const clickBlank = (index) => {
        if (fills[index] != null) {
            const next = [...fills];
            next[index] = null;
            onChange(next);
        }
        setActive(index);
    };

    return (
        <div>
            <BlankPassage
                html={question.description}
                className='text-lg text-slate-800 leading-[2.75]'
                renderBlank={(index) => {
                    const word = fills[index] != null ? question.wordBank[fills[index]] : null;
                    const isActive = index === active && !word;
                    return (
                        <button
                            type='button'
                            onClick={() => clickBlank(index)}
                            aria-label={word ? `Blank ${index + 1}: ${word}. Click to remove.` : `Blank ${index + 1}, empty`}
                            className={`inline-flex items-center justify-center min-w-28 mx-1 px-4 py-0.5 rounded-lg border-b-2 align-middle text-base transition-colors ${
                                word
                                    ? 'bg-purple-50 border-purple-500 text-purple-700 font-semibold hover:bg-purple-100'
                                    : isActive
                                        ? 'bg-purple-50 border-purple-500 text-purple-400'
                                        : 'bg-slate-50 border-slate-300 text-slate-400 hover:border-purple-300'}`}
                        >
                            {word || '............'}
                        </button>
                    );
                }}
            />

            <div className='mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 p-5 bg-slate-50/60 border border-slate-200 rounded-2xl'>
                {question.wordBank.map((word, index) => (
                    <button
                        key={index}
                        type='button'
                        onClick={() => placeWord(index)}
                        disabled={used.has(index)}
                        className='px-4 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-sm text-slate-700 hover:border-purple-300 hover:bg-purple-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-slate-200'
                    >
                        {word}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default AttemptFillBlank;
