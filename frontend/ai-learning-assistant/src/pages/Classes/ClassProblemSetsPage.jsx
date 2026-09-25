import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Plus, ListChecks, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import moment from 'moment';
import problemSetService from '../../services/ProblemSetService';
import Spinner from '../../components/common/Spinner';
import { useAuth } from '../../context/AuthContext';

const STAFF_ROLES = ['lecturer', 'parents', 'admin'];

const ClassProblemSetsPage = () => {
    const { classData } = useOutletContext();
    const { user } = useAuth();
    const navigate = useNavigate();
    //Everyone in the class can view published problem sets, only lecturer, parents and admin can create or delete them.
    const canManage = STAFF_ROLES.includes(user?.role);

    const [sets, setSets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const fetchSets = async () => {
        try {
            const result = await problemSetService.getProblemSets(classData.id);
            setSets(Array.isArray(result?.data) ? result.data : []);

        } catch (error) {
            toast.error(error.error || "Failed to fetch the problem sets.");
            console.error(error);

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSets();
    }, [classData.id]);

    //A draft is created immediately, so the lecturer lands straight in the builder for it.
    const handleCreate = async () => {
        setCreating(true);
        try {
            const result = await problemSetService.createProblemSet(classData.id, 'Untitled Problem Set');
            navigate(`/classes/${classData.id}/problem-sets/${result.data.id}`);

        } catch (error) {
            toast.error(error.error || "Failed to create the problem set.");
            console.error(error);

        } finally {
            setCreating(false);
        }
    };

    const handleConfirmDelete = async () => {
        setDeleting(true);
        try {
            await problemSetService.deleteProblemSet(classData.id, deleteTarget.id);
            toast.success(`"${deleteTarget.title}" deleted successfully.`);
            setSets((prev) => prev.filter((s) => s.id !== deleteTarget.id));
            setDeleteTarget(null);

        } catch (error) {
            toast.error(error.error || "Failed to delete the problem set.");
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

        if (sets.length === 0) {
            return (
                <div className='flex flex-col items-center justify-center py-24 text-center'>
                    <div className='w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4'>
                        <ListChecks className='w-8 h-8 text-purple-400' />
                    </div>
                    <h3 className='text-lg font-medium text-slate-700 mb-1'>No problem sets yet</h3>
                    <p className='text-slate-400 text-sm mb-6'>
                        {canManage ? 'Create the first problem set for this class.' : 'Nothing has been published yet.'}
                    </p>
                    {canManage && (
                        <button
                            onClick={handleCreate}
                            disabled={creating}
                            className='flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
                        >
                            <Plus className='w-4 h-4' />
                            {creating ? 'Creating...' : 'Create Problem Set'}
                        </button>
                    )}
                </div>
            );
        }

        return (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                {sets.map((set) => (
                    <div
                        key={set.id}
                        onClick={() => navigate(`/classes/${classData.id}/problem-sets/${set.id}`)}
                        className='bg-white border border-slate-200 rounded-xl p-5 cursor-pointer hover:shadow-md hover:border-purple-300 transition-all group'
                    >
                        <div className='flex items-start justify-between gap-3'>
                            <div className='flex items-center gap-4 min-w-0'>
                                <div className='w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0'>
                                    <ListChecks className='w-5 h-5 text-purple-500' />
                                </div>
                                <div className='min-w-0'>
                                    <p className='text-sm font-bold text-slate-800 truncate'>{set.title}</p>
                                    <p className='text-xs text-slate-400 truncate'>by {set.author_name}</p>
                                </div>
                            </div>
                            {canManage && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(set); }}
                                    className='opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all shrink-0'
                                    aria-label='Delete problem set'
                                >
                                    <Trash2 className='w-4 h-4' />
                                </button>
                            )}
                        </div>
                        <div className='flex items-center justify-between mt-3'>
                            <p className='text-xs text-slate-400'>
                                Created {moment(set.created_at).format('MMM D, YYYY')}
                            </p>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${
                                set.status === 'published'
                                    ? 'bg-purple-50 text-purple-600 border-purple-100'
                                    : 'bg-amber-50 text-amber-600 border-amber-100'
                            }`}>
                                {set.status}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div>
            <div className='flex items-center justify-between mb-8'>
                <div className='flex items-center gap-4'>
                    <div className='w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0'>
                        <ListChecks className='w-7 h-7 text-purple-600' strokeWidth={2} />
                    </div>
                    <div>
                        <h2 className='text-2xl font-bold text-slate-900'>Problem Sets</h2>
                        <p className='text-sm text-slate-500'>Practice problems for this class.</p>
                    </div>
                </div>
                {canManage && sets.length > 0 && (
                    <button
                        onClick={handleCreate}
                        disabled={creating}
                        className='flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
                    >
                        <Plus className='w-4 h-4' />
                        {creating ? 'Creating...' : 'Create Problem Set'}
                    </button>
                )}
            </div>

            {renderContent()}

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50'>
                    <div className='bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6'>
                        <div className='flex items-center gap-3 mb-4'>
                            <div className='w-10 h-10 bg-red-50 rounded-full flex items-center justify-center'>
                                <Trash2 className='w-5 h-5 text-red-500' />
                            </div>
                            <h2 className='text-lg font-semibold text-slate-800'>Delete Problem Set</h2>
                        </div>
                        <p className='text-sm text-slate-500 mb-6'>
                            Are you sure you want to delete <span className='font-medium text-slate-700'>"{deleteTarget.title}"</span>? This action cannot be undone.
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

export default ClassProblemSetsPage;
