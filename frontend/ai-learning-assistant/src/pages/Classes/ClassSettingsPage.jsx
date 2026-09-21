import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Settings, UserCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import moment from 'moment';
import classService from '../../services/ClassService';

const ClassProfilePage = () => {
    const { classData, setClassData } = useOutletContext();
    //Only the owner (or an admin) can edit, students just see the class information.
    const isOwner = classData.class_role === 'owner';

    const [className, setClassName] = useState(classData.class_name);
    const [maxStudents, setMaxStudents] = useState(String(classData.max_students));
    const [saving, setSaving] = useState(false);

    const handleUpdate = async (e) => {
        e.preventDefault();

        if (!className.trim() || !maxStudents) {
            toast.error("Please enter the class name and number of students.");
            return;
        }

        setSaving(true);
        try {
            await classService.updateClass(classData.id, className.trim(), Number(maxStudents));
            setClassData((prev) => ({ ...prev, class_name: className.trim(), max_students: Number(maxStudents) }));
            toast.success("Class updated successfully.");

        } catch (error) {
            toast.error(error.error || "Failed to update the class.");
            console.error(error);

        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <div className='flex items-center gap-4 mb-8'>
                <div className='w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0'>
                    <Settings className='w-7 h-7 text-purple-600' strokeWidth={2} />
                </div>
                <div>
                    <h2 className='text-2xl font-bold text-slate-900'>Settings</h2>
                    <p className='text-sm text-slate-500'>Edit or update class information</p>
                </div>
            </div>

            <form onSubmit={handleUpdate} className='max-w-md space-y-4'>
                <div className='flex flex-col gap-1.5'>
                    <label className='text-sm font-medium text-slate-700'>Class Name:</label>
                    <input
                        type='text'
                        value={className}
                        onChange={(e) => setClassName(e.target.value)}
                        disabled={!isOwner}
                        maxLength={150}
                        className='w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 disabled:bg-slate-50 disabled:text-slate-500'
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
                        disabled={!isOwner}
                        className='w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 disabled:bg-slate-50 disabled:text-slate-500'
                    />
                </div>

                <div className='rounded-xl bg-slate-50 p-4 space-y-2 text-sm'>
                    <p><span className='font-medium text-slate-700'>Class Code:</span> {classData.class_code}</p>
                    <p><span className='font-medium text-slate-700'>Created on:</span> {moment(classData.created_at).format('MMM D, YYYY')}</p>
                    <p><span className='font-medium text-slate-700'>Students:</span> {classData.member_count} / {classData.max_students}</p>
                </div>

                {isOwner && (
                    <button
                        type='submit'
                        disabled={saving}
                        className='bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors'
                    >
                        {saving ? 'Updating...' : 'Update'}
                    </button>
                )}
            </form>
        </div>
    );
};

export default ClassProfilePage;
