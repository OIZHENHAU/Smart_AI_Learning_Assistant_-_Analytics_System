import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const WINDOW = 5;

//Round arrow / number buttons. Shows up to 5 page numbers and slides them so the current page stays visible.
const Pagination = ({ page, totalPages, onChange }) => {
    if (totalPages <= 1) return null;

    const start = Math.max(1, Math.min(page - Math.floor(WINDOW / 2), totalPages - WINDOW + 1));
    const end = Math.min(totalPages, start + WINDOW - 1);
    const pages = Array.from({ length: end - start + 1 }, (_, index) => start + index);

    const base = 'w-8 h-8 flex items-center justify-center rounded-full border text-sm transition-colors';
    const idle = 'border-slate-300 text-slate-700 hover:bg-purple-50 hover:border-purple-300';
    const arrow = `${base} ${idle} disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-slate-300`;

    return (
        <nav className='flex items-center justify-center gap-2' aria-label='Pagination'>
            <button onClick={() => onChange(page - 1)} disabled={page === 1} aria-label='Previous page' className={arrow}>
                <ChevronLeft className='w-4 h-4' />
            </button>

            {pages.map((number) => (
                <button
                    key={number}
                    onClick={() => onChange(number)}
                    aria-current={number === page ? 'page' : undefined}
                    className={`${base} ${number === page ? 'bg-purple-100 border-purple-400 text-purple-700 font-semibold' : idle}`}
                >
                    {number}
                </button>
            ))}

            <button onClick={() => onChange(page + 1)} disabled={page === totalPages} aria-label='Next page' className={arrow}>
                <ChevronRight className='w-4 h-4' />
            </button>
        </nav>
    );
};

export default Pagination;
