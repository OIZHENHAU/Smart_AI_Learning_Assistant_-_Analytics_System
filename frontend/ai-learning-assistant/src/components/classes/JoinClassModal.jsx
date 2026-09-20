import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import classService from '../../services/ClassService';

const JoinClassModal = ({ isOpen, onClose, onFound }) => {
    const [classCode, setClassCode] = useState('');
    const [checking, setChecking] = useState(false);

    const handleClose = () => {
        setClassCode('');
        onClose();
    };

    //Check the class exists, then hand it to the page so the class details pop-up can open.
    const handleConfirm = async (e) => {
        e.preventDefault();

        if (!classCode.trim()) {
            toast.error("Please enter the class code.");
            return;
        }

        setChecking(true);
        try {
            const result = await classService.findClassByCode(classCode.trim());
            handleClose();
            onFound(result.data);

        } catch (error) {
            toast.error(error.error || "Failed to find the class.");
            console.error(error);

        } finally {
            setChecking(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title='Join Class'>
            <form onSubmit={handleConfirm} className='space-y-4'>
                <div className='flex flex-col gap-1.5'>
                    <label className='text-sm font-medium text-slate-700'>Class Code:</label>
                    <input
                        type='text'
                        value={classCode}
                        onChange={(e) => setClassCode(e.target.value)}
                        placeholder='Enter the class code'
                        autoFocus
                        className='w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400'
                    />
                </div>

                <div className='flex gap-3 pt-2'>
                    <button
                        type='button'
                        onClick={handleClose}
                        disabled={checking}
                        className='flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50'
                    >
                        Cancel
                    </button>
                    <button
                        type='submit'
                        disabled={checking}
                        className='flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white py-2 rounded-lg text-sm font-medium transition-colors'
                    >
                        {checking ? 'Checking...' : 'Confirm'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default JoinClassModal;
