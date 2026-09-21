import React from 'react';
import { CalendarDays, Pencil, Trash2 } from 'lucide-react';
import moment from 'moment';

const AnnouncementCard = ({ announcement, canManage, onEdit, onDelete }) => {
    return (
        <div className='bg-white border border-slate-200 rounded-lg p-5'>
            <div className='flex items-start justify-between gap-4'>
                <div className='min-w-0'>
                    <h3 className='flex items-center gap-2 text-2xl font-bold text-purple-700'>
                        <CalendarDays className='w-5 h-5 shrink-0' />
                        <span className='break-words'>{announcement.title}</span>
                    </h3>
                    <p className='text-sm text-slate-500 mt-1'>
                        {moment(announcement.created_at).format('dddd, MMMM D YYYY, HH:mm')} by{' '}
                        <span className='text-purple-600'>{announcement.author_name}</span>
                    </p>
                </div>

                {/* Students can read, but only lecturer, parents and admin see the edit and delete icons */}
                {canManage && (
                    <div className='flex items-center gap-3 shrink-0'>
                        <button onClick={() => onEdit(announcement)} className='text-slate-900 hover:text-purple-600' aria-label='Edit announcement'>
                            <Pencil className='w-5 h-5' />
                        </button>
                        <button onClick={() => onDelete(announcement)} className='text-slate-400 hover:text-red-500' aria-label='Delete announcement'>
                            <Trash2 className='w-5 h-5' />
                        </button>
                    </div>
                )}
            </div>

            {/* The backend cleans this HTML before saving, so it is safe to render */}
            <div className='rich-content mt-4 text-slate-800' dangerouslySetInnerHTML={{ __html: announcement.content }} />
        </div>
    );
};

export default AnnouncementCard;
