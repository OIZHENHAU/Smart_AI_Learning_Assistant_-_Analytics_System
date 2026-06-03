import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4'>
            <div className='bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col'>
                <div className='flex items-center justify-between px-6 py-4 border-b border-slate-200'>
                    <h3 className='text-base font-semibold text-slate-900'>{title}</h3>
                    <button
                        onClick={onClose}
                        className='w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all'
                    >
                        <X className='w-4 h-4' />
                    </button>
                </div>
                <div className='p-6'>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
