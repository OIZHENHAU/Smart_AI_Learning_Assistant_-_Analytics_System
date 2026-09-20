import React from 'react';

const ClassSectionPage = ({ title, description, icon: Icon }) => {
    return (
        <div>
            <div className='flex items-center gap-4 mb-8'>
                <div className='w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0'>
                    <Icon className='w-7 h-7 text-purple-600' strokeWidth={2} />
                </div>
                <div>
                    <h2 className='text-2xl font-bold text-slate-900'>{title}</h2>
                    <p className='text-sm text-slate-500'>{description}</p>
                </div>
            </div>

            <div className='flex flex-col items-center justify-center py-24 text-center'>
                <div className='w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4'>
                    <Icon className='w-8 h-8 text-purple-400' />
                </div>
                <h3 className='text-lg font-medium text-slate-700 mb-1'>{title} is coming soon</h3>
                <p className='text-slate-400 text-sm'>This section is not built yet.</p>
            </div>
        </div>
    );
};

export default ClassSectionPage;
