import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import classService from '../../services/ClassService';

const CreateClassModal = ({ isOpen, onClose, onCreated }) => {
    const [className, setClassName] = useState('');
    const [maxStudents, setMaxStudents] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleClose = () => {
        setClassName('');
        setMaxStudents('');
        onClose();
    };

    const handleConfirm = async (e) => {
        e.preventDefault();

        if (!className.trim() || !maxStudents) {
            toast.error("Please enter the class name and number of students.");
            return;
        }

        setSubmitting(true);
        try {
            const result = await classService.createClass(className.trim(), Number(maxStudents));
            toast.success(`Class created. Class code: ${result.data.class_code}`);
            handleClose();
            onCreated();

        } catch (error) {
            toast.error(error.error || "Failed to create the class.");
            console.error(error);

        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title='Create Class'>
            <form onSubmit={handleConfirm} className='space-y-4'>
                <div className='flex flex-col gap-1.5'>
                    <label className='text-sm font-medium text-slate-700'>Class Name:</label>
                    <input
                        type='text'
                        value={className}
                        onChange={(e) => setClassName(e.target.value)}
                        maxLength={150}
                        className='w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400'
                    />
                </div>

                <div className='flex flex-col gap-1.5'>
                    <label className='text-sm font-medium text-slate-700'>Number of Students:</label>
                    <input
                        type='number'
                        min={1}
                        max={500}
                        value={maxStudents}
                        onChange={(e) => setMaxStudents(e.target.value)}
                        className='w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400'
                    />
                </div>

                <div className='flex gap-3 pt-2'>
                    <button
                        type='button'
                        onClick={handleClose}
                        disabled={submitting}
                        className='flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50'
                    >
                        Cancel
                    </button>
                    <button
                        type='submit'
                        disabled={submitting}
                        className='flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white py-2 rounded-lg text-sm font-medium transition-colors'
                    >
                        {submitting ? 'Creating...' : 'Confirm'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default CreateClassModal;
