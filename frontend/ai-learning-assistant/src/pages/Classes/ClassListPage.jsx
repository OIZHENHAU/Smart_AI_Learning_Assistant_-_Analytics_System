import React, { useState, useEffect } from 'react';
import { School, Plus, Trash2, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import classService from '../../services/ClassService';
import Spinner from '../../components/common/Spinner';
import ClassCard from '../../components/classes/ClassCard';
import CreateClassModal from '../../components/classes/CreateClassModal';
import ClassDetailModal from '../../components/classes/ClassDetailModal';
import JoinClassModal from '../../components/classes/JoinClassModal';
import { useAuth } from '../../context/AuthContext';

const ClassListPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    //Students can't create classes, they join one with a class code instead.
    const isStudent = user?.role === 'student';

    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [showJoin, setShowJoin] = useState(false);
    const [selectedClass, setSelectedClass] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    //Search filters, all empty by default so every class is shown.
    const [nameFilter, setNameFilter] = useState('');
    const [codeFilter, setCodeFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const hasFilters = nameFilter || codeFilter || startDate || endDate;

    const fetchClasses = async () => {
        try {
            const data = await classService.getAllClasses({
                className: nameFilter, classCode: codeFilter, startDate, endDate
            });
            setClasses(Array.isArray(data?.data) ? data.data : []);

        } catch (error) {
            toast.error("Failed to fetch classes.");
            console.error(error);

        } finally {
            setLoading(false);
        }
    };

    //Runs on mount, then (debounced) whenever a search filter changes.
    useEffect(() => {
        const timeout = setTimeout(fetchClasses, 400);
        return () => clearTimeout(timeout);
    }, [nameFilter, codeFilter, startDate, endDate]);

    //Opening a class goes into its workspace, a pending or deactivated student cannot access this class.
    const handleOpenClass = (classData) => {
        if (classData.my_status === 'pending') {
            toast.error("Your request to join this class is still waiting for approval.");
            return;
        }
        if (classData.my_status === 'deactivated') {
            toast.error("Your access to this class has been deactivated.");
            return;
        }
        navigate(`/classes/${classData.id}`);
    };

    const handleConfirmDelete = async () => {
        setDeleting(true);
        try {
            await classService.deleteClass(deleteTarget.id);
            toast.success(`"${deleteTarget.class_name}" deleted successfully.`);
            setClasses((prev) => prev.filter((c) => c.id !== deleteTarget.id));
            setDeleteTarget(null);

        } catch (error) {
            toast.error(error.error || "Failed to delete the class.");
            console.error(error);

        } finally {
            setDeleting(false);
        }
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className='flex justify-center items-center py-20'>
                    <Spinner />
                </div>
            );
        }

        if (classes.length === 0) {
            return (
                <div className='flex flex-col items-center justify-center py-24 text-center'>
                    <div className='w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4'>
                        <GraduationCap className='w-8 h-8 text-purple-400' />
                    </div>
                    <h3 className='text-lg font-medium text-slate-700 mb-1'>
                        {hasFilters ? 'No matching class' : isStudent ? 'No class joined yet' : 'No class created yet'}
                    </h3>
                    <p className='text-slate-400 text-sm mb-6'>
                        {hasFilters
                            ? 'Try changing your search.'
                            : isStudent ? 'Join a class with the class code from your lecturer.' : 'Create class to add your team.'}
                    </p>
                    {!hasFilters && (
                        <button
                            onClick={() => isStudent ? setShowJoin(true) : setShowCreate(true)}
                            className='flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
                        >
                            <Plus className='w-4 h-4' />
                            {isStudent ? 'Join Class' : 'Create Class'}
                        </button>
                    )}
                </div>
            );
        }

        return (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                {classes.map((c) => (
                    <ClassCard
                        key={c.id}
                        classData={c}
                        onOpen={handleOpenClass}
                        onDelete={setDeleteTarget}
                        canDelete={!isStudent}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className='min-h-screen p-6'>
            <div className='relative max-w-7xl mx-auto'>
                {/* Header */}
                <div className='flex items-center justify-between mb-8'>
                    <div className='flex items-center gap-4'>
                        <div className='w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0'>
                            <GraduationCap className='w-7 h-7 text-purple-600' strokeWidth={2} />
                        </div>
                        <div>
                            <h1 className='text-2xl font-bold text-slate-900'>{isStudent ? 'My Classes' : 'Create Class'}</h1>
                            <p className='text-sm text-slate-500'>
                                {isStudent ? 'Join a class with your class code' : 'Create class and organise your group'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => isStudent ? setShowJoin(true) : setShowCreate(true)}
                        className='flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
                    >
                        <Plus className='w-4 h-4' />
                        {isStudent ? 'Join Class' : 'Create Class'}
                    </button>
                </div>

                {/* Search bar */}
                <div className='flex flex-wrap items-end gap-4 w-full mb-8'>
                    <div className='flex-1 min-w-[180px] flex flex-col gap-1.5'>
                        <label className='text-sm font-medium text-slate-700'>Class Name:</label>
                        <input
                            type='text'
                            value={nameFilter}
                            onChange={(e) => setNameFilter(e.target.value)}
                            className='w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400'
                        />
                    </div>
                    <div className='flex-1 min-w-[180px] flex flex-col gap-1.5'>
                        <label className='text-sm font-medium text-slate-700'>Class Code:</label>
                        <input
                            type='text'
                            value={codeFilter}
                            onChange={(e) => setCodeFilter(e.target.value)}
                            className='w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400'
                        />
                    </div>
                    <div className='flex-[1.6] min-w-[280px] flex flex-col gap-1.5'>
                        <label className='text-sm font-medium text-slate-700'>Created At:</label>
                        <div className='flex items-center gap-2'>
                            <input
                                type='date'
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className='flex-1 h-10 px-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400'
                            />
                            <span className='text-sm text-slate-500 shrink-0'>to</span>
                            <input
                                type='date'
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className='flex-1 h-10 px-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400'
                            />
                        </div>
                    </div>
                </div>

                {renderContent()}
            </div>

            <CreateClassModal
                isOpen={showCreate}
                onClose={() => setShowCreate(false)}
                onCreated={fetchClasses}
            />

            {/* Student: enter a class code, and if the class exists its details pop up with a Join button */}
            <JoinClassModal
                isOpen={showJoin}
                onClose={() => setShowJoin(false)}
                onFound={setSelectedClass}
            />

            <ClassDetailModal
                classData={selectedClass}
                onClose={() => setSelectedClass(null)}
                onChanged={fetchClasses}
            />

            {/* Delete confirmation */}
            {deleteTarget && (
                <div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50'>
                    <div className='bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6'>
                        <div className='flex items-center gap-3 mb-4'>
                            <div className='w-10 h-10 bg-red-50 rounded-full flex items-center justify-center'>
                                <Trash2 className='w-5 h-5 text-red-500' />
                            </div>
                            <h2 className='text-lg font-semibold text-slate-800'>Delete Class</h2>
                        </div>
                        <p className='text-sm text-slate-500 mb-6'>
                            Are you sure you want to delete <span className='font-medium text-slate-700'>"{deleteTarget.class_name}"</span>?
                            All members will be removed from it.
                        </p>
                        <div className='flex gap-3'>
                            <button
                                onClick={() => setDeleteTarget(null)}
                                disabled={deleting}
                                className='flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50'
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={deleting}
                                className='flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white py-2 rounded-lg text-sm font-medium transition-colors'
                            >
                                {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClassListPage;
