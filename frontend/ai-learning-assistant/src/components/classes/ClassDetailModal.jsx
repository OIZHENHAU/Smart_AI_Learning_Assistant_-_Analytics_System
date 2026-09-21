import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import moment from 'moment';
import Modal from '../common/Modal';
import classService from '../../services/ClassService';
import { useAuth } from '../../context/AuthContext';

const ClassDetailModal = ({ classData, onClose, onChanged }) => {
    const { user } = useAuth();
    const isStudent = user?.role === 'student';

    const [className, setClassName] = useState('');
    const [maxStudents, setMaxStudents] = useState('');
    const [busy, setBusy] = useState(false);

    //Reset the form to the saved values every time a different class is opened.
    useEffect(() => {
        if (classData) {
            setClassName(classData.class_name);
            setMaxStudents(String(classData.max_students));
        }
    }, [classData]);

    if (!classData) return null;

    const isFull = classData.member_count >= classData.max_students;

    const joinLabel = classData.my_status === 'pending'
        ? 'Pending'
        : classData.my_status === 'approved'
            ? 'Joined'
            : classData.my_status === 'deactivated'
                ? 'Deactivated'
                : isFull ? 'Full' : 'Join';

    const handleUpdate = async () => {
        if (!className.trim() || !maxStudents) {
            toast.error("Please enter the class name and number of students.");
            return;
        }

        setBusy(true);
        try {
            await classService.updateClass(classData.id, className.trim(), Number(maxStudents));
            toast.success("Class updated successfully.");
            onChanged();
            onClose();

        } catch (error) {
            toast.error(error.error || "Failed to update the class.");
            console.error(error);

        } finally {
            setBusy(false);
        }
    };

    const handleJoin = async () => {
        setBusy(true);
        try {
            const result = await classService.joinClass(classData.id);
            toast.success(result.message || "You have joined the class.");
            onChanged();
            onClose();

        } catch (error) {
            toast.error(error.error || "Failed to join the class.");
            console.error(error);

        } finally {
            setBusy(false);
        }
    };

    return (
        <Modal isOpen={!!classData} onClose={onClose} title='Class Information'>
            <div className='space-y-4'>
                {isStudent ? (
                    <div className='rounded-xl bg-slate-50 p-4 space-y-2 text-sm'>
                        <p><span className='font-medium text-slate-700'>Class Name:</span> {classData.class_name}</p>
                        <p><span className='font-medium text-slate-700'>Class Code:</span> {classData.class_code}</p>
                        <p><span className='font-medium text-slate-700'>Lecturer:</span> {classData.owner_name}</p>
                        <p><span className='font-medium text-slate-700'>Created on:</span> {moment(classData.created_at).format('MMM D, YYYY')}</p>
                        <p><span className='font-medium text-slate-700'>Students:</span> {classData.member_count} / {classData.max_students}</p>
                    </div>
                ) : (
                    <>
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

                        {/* Read-only information */}
                        <div className='rounded-xl bg-slate-50 p-4 space-y-2 text-sm'>
                            <p><span className='font-medium text-slate-700'>Class Code:</span> {classData.class_code}</p>
                            <p><span className='font-medium text-slate-700'>Created by:</span> {classData.owner_name}</p>
                            <p><span className='font-medium text-slate-700'>Created on:</span> {moment(classData.created_at).format('MMM D, YYYY')}</p>
                            <p><span className='font-medium text-slate-700'>Joined:</span> {classData.member_count} / {classData.max_students}</p>
                        </div>
                    </>
                )}

                <div className='flex gap-3 pt-2'>
                    <button
                        onClick={onClose}
                        disabled={busy}
                        className='flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50'
                    >
                        Cancel
                    </button>
                    {/* Students can't edit the class, so they only get Join */}
                    {!isStudent && (
                        <button
                            onClick={handleUpdate}
                            disabled={busy}
                            className='flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white py-2 rounded-lg text-sm font-medium transition-colors'
                        >
                            Update
                        </button>
                    )}
                    <button
                        onClick={handleJoin}
                        disabled={busy || !!classData.my_status || isFull}
                        className='flex-1 border border-purple-200 bg-purple-50 text-purple-700 py-2 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                        {joinLabel}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ClassDetailModal;
