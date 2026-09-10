import React from 'react';
import { Trash2, Play, ClipboardList } from 'lucide-react';
import moment from 'moment';

const FlashcardSetCard = ({ set, onDelete, onStudy }) => {
    const title = set.title ? `Flashcard - ${set.title}` : 'Flashcard Set';
    const cardCount = set.cards?.length ?? set.card_count ?? 0;

    return (
        <div className='group relative flex flex-col justify-between rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/10'>
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

            <div className='space-y-4'>
                <div>
                    <span className='inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700'>
                        <ClipboardList className='h-4 w-4 text-purple-600' strokeWidth={3} />
                        {cardCount} {cardCount === 1 ? 'card' : 'cards'}
                    </span>
                </div>

                <div>
                    <h4
                        className='text-base font-semibold leading-snug text-slate-900 line-clamp-2'
                        title={title}
                    >
                        {title}
                    </h4>
                    <p className='mt-1 text-xs font-medium uppercase tracking-wide text-slate-500'>
                        Created {moment(set.created_at).format('MMM D, YYYY')}
                    </p>
                </div>
            </div>

            <div className='mt-6 border-t border-slate-100 pt-5'>
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
