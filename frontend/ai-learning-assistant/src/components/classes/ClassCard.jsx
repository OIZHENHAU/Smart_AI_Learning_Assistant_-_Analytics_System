import React from 'react';
import { Trash2, School } from 'lucide-react';
import moment from 'moment';

const ClassCard = ({ classData, onOpen, onDelete, canDelete = true }) => {
    const isPending = classData.my_status === 'pending';
    const isDeactivated = classData.my_status === 'deactivated';

    return (
        <div
            onClick={() => onOpen(classData)}
            className='bg-white border border-slate-200 rounded-xl p-5 cursor-pointer hover:shadow-md hover:border-purple-300 transition-all group'
        >
            <div className='flex items-start justify-between gap-3'>
                <div className='flex items-center gap-4 min-w-0'>
                    <div className='w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0'>
                        <School className='w-5 h-5 text-purple-500' />
                    </div>
                    <div className='min-w-0'>
                        <p className='text-sm font-bold text-slate-800 truncate'>{classData.class_name}</p>
                        <p className='text-xs text-slate-400 truncate'>{classData.class_code}</p>
                    </div>
                </div>
                {canDelete && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(classData); }}
                        className='opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all shrink-0'
                        aria-label='Delete class'
                    >
                        <Trash2 className='w-4 h-4' />
                    </button>
                )}
            </div>
            <div className='flex items-center justify-between mt-3'>
                <p className='text-xs text-slate-400'>
                    Created on {moment(classData.created_at).format('MMM D, YYYY')}
                </p>
                {/* A student whose request hasn't been approved yet (or was deactivated) sees the status instead of the student count */}
                {isPending ? (
                    <span className='text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100'>
                        pending
                    </span>
                ) : isDeactivated ? (
                    <span className='text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100'>
                        deactivated
                    </span>
                ) : (
                    <span className='text-xs font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100'>
                        {classData.member_count} / {classData.max_students} students
                    </span>
                )}
            </div>
        </div>
    );
};

export default ClassCard;
