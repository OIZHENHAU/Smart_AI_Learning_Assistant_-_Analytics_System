import React, { useState } from 'react';
import { Star, RotateCcw } from 'lucide-react';

const difficultyStyles = {
    easy: 'bg-purple-50 text-purple-700 border-purple-200',
    medium: 'bg-purple-100 text-purple-700 border-purple-300',
    hard: 'bg-purple-200 text-purple-800 border-purple-400',
};

const Flashcard = ({ flashcard, onToggleStar }) => {
    const [isFlipped, setIsFlipped] = useState(false);

    if (!flashcard) {
        return null;
    }

    const isStarred = Boolean(flashcard.is_started);
    const difficulty = (flashcard.difficulty || 'medium').toLowerCase();

    const handleFlip = () => setIsFlipped((prev) => !prev);

    const handleStarClick = (e) => {
        e.stopPropagation();
        onToggleStar?.(flashcard.id);
    };

    const starButton = (onLight) => (
        <button
            type='button'
            onClick={handleStarClick}
            aria-label={isStarred ? 'Remove star' : 'Star this card'}
            className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                isStarred
                    ? onLight
                        ? 'bg-purple-500 text-white'
                        : 'bg-white text-purple-600'
                    : onLight
                        ? 'bg-slate-100 text-slate-400 hover:bg-purple-50 hover:text-purple-500'
                        : 'bg-white/15 text-white/80 hover:bg-white/25'
            }`}
        >
            <Star className='h-4 w-4' fill={isStarred ? 'currentColor' : 'none'} />
        </button>
    );

    return (
        <div className='mx-auto w-full max-w-3xl' style={{ perspective: '1600px' }}>
            <div
                onClick={handleFlip}
                className='relative h-72 w-full cursor-pointer transition-transform duration-500'
                style={{
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
            >
                {/* Front — question */}
                <div
                    className='absolute inset-0 flex flex-col rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_20px_45px_-25px_rgba(88,28,135,0.35)]'
                    style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                >
                    <div className='flex items-start justify-between'>
                        <span
                            className={`rounded-lg border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                                difficultyStyles[difficulty] || difficultyStyles.medium
                            }`}
                        >
                            {difficulty}
                        </span>
                        {starButton(true)}
                    </div>

                    <div className='flex flex-1 items-center justify-center text-center'>
                        <p className='text-xl font-semibold text-slate-900'>{flashcard.question}</p>
                    </div>

                    <div className='flex items-center justify-center gap-2 text-sm text-slate-400'>
                        <RotateCcw className='h-4 w-4' />
                        Click to reveal answer
                    </div>
                </div>

                {/* Back — answer */}
                <div
                    className='absolute inset-0 flex flex-col rounded-3xl bg-linear-to-br from-purple-500 to-purple-700 p-8 text-white shadow-[0_25px_55px_-20px_rgba(88,28,135,0.6)]'
                    style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                    }}
                >
                    <div className='flex items-start justify-end'>{starButton(false)}</div>

                    <div className='flex flex-1 items-center justify-center text-center'>
                        <p className='text-xl font-semibold'>{flashcard.answer}</p>
                    </div>

                    <div className='flex items-center justify-center gap-2 text-sm text-white/70'>
                        <RotateCcw className='h-4 w-4' />
                        Click to see question
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Flashcard;
