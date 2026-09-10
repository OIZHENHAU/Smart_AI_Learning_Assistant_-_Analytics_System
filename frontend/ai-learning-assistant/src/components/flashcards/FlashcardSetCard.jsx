import React from 'react';
import { Brain, Trash2, Play, ClipboardListIcon } from 'lucide-react';
import moment from 'moment';

const FlashcardSetCard = ({ set, onDelete, onStudy }) => {
    const title = set.title ? `Flashcard - ${set.title}` : 'Flashcard Set';
    const cardCount = set.cards?.length ?? set.card_count ?? 0;

    return (
        <div className='group relative flex flex-col justify-between rounded-2xl border-2 border-slate-200 bg-white p-5 transition-all duration-200 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/10'>
            <button
                type='button'
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(set);
                }}
                className='absolute right-4 top-4 rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500'
                aria-label='Delete flashcard set'
            >
                <Trash2 className='h-4 w-4' />
            </button>

            <div>
                <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100'>
                    <ClipboardListIcon className='h-6 w-6 text-purple-600' />
                </div>

                <h4 className='text-base font-semibold text-slate-900 line-clamp-2' title={title}>
                    {title}
                </h4>
                <p className='mt-1 text-xs font-medium uppercase tracking-wide text-slate-500'>
                    Created {moment(set.created_at).format('MMM D, YYYY')}
                </p>

                <div className='mt-4 border-t border-slate-100 pt-4'>
                    <span className='inline-flex rounded-lg bg-purple-50 px-3 py-1.5 text-sm font-semibold text-purple-700'>
                        {cardCount} cards
                    </span>
                </div>
            </div>

            <div className='mt-4 border-t border-slate-100 pt-4'>
                <button
                    type='button'
                    onClick={() => onStudy?.(set)}
                    className='group/btn relative h-11 w-full overflow-hidden rounded-xl bg-linear-to-r from-purple-500 to-purple-600 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 transition-all duration-200 hover:from-purple-600 hover:to-purple-700 active:scale-95'
                >
                    <span className='relative z-10 flex items-center justify-center gap-2'>
                        <Play className='h-4 w-4' />
                        Study Flashcards
                    </span>
                    <div className='absolute inset-0 -translate-x-full bg-linear-to-r from-white/0 via-white/20 to-white/0 transition-transform duration-700 group-hover/btn:translate-x-full' />
                </button>
            </div>
        </div>
    );
};

export default FlashcardSetCard;
