import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Plus, ListChecks, Trash2, Pencil, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import moment from 'moment';
import problemSetService from '../../services/ProblemSetService';
import Spinner from '../../components/common/Spinner';
import { useAuth } from '../../context/AuthContext';
import { BASE_URL } from '../../utils/apiPath';

const STAFF_ROLES = ['lecturer', 'parents', 'admin'];

const ClassProblemSetsPage = () => {
    const { classData } = useOutletContext();
    const { user } = useAuth();
    const navigate = useNavigate();
    //Everyone in the class can view published problem sets, only lecturer, parents and admin can create, edit or delete them.
    const canManage = STAFF_ROLES.includes(user?.role);

    const [sets, setSets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    //Search filters, all empty by default so every problem set is shown.
    const [titleFilter, setTitleFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const hasFilters = titleFilter || startDate || endDate;

    const fetchSets = async () => {
        try {
            const result = await problemSetService.getProblemSets(classData.id, { title: titleFilter, startDate, endDate });
            setSets(Array.isArray(result?.data) ? result.data : []);

        } catch (error) {
            toast.error(error.error || "Failed to fetch the problem sets.");
            console.error(error);

        } finally {
            setLoading(false);
        }
    };

    //Runs on mount, then (debounced) whenever a search filter changes.
    useEffect(() => {
        const timeout = setTimeout(fetchSets, 400);
        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [classData.id, titleFilter, startDate, endDate]);

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

    //Where the title / primary action of a row goes: the builder for staff, the attempt or review page for a student.
    const primaryPath = (set) => {
        if (canManage) return `/classes/${classData.id}/problem-sets/${set.id}`;
        return set.my_attempt
            ? `/classes/${classData.id}/problem-sets/${set.id}/attempt/result`
            : `/classes/${classData.id}/problem-sets/${set.id}/attempt`;
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

            {/* Search bar */}
            <div className='flex flex-wrap items-end gap-4 w-full mb-8'>
                <div className='flex-1 min-w-[220px] flex flex-col gap-1.5'>
                    <label className='text-sm font-medium text-slate-700'>Title or Content:</label>
                    <input
                        type='text'
                        value={titleFilter}
                        onChange={(e) => setTitleFilter(e.target.value)}
                        className='w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400'
                    />
                </div>
                <div className='flex-[1.4] min-w-[280px] flex flex-col gap-1.5'>
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

            {loading ? (
                <div className='flex justify-center items-center py-20'>
                    <Spinner />
                </div>
            ) : sets.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-24 text-center'>
                    <div className='w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4'>
                        <ListChecks className='w-8 h-8 text-purple-400' />
                    </div>
                    <h3 className='text-lg font-medium text-slate-700 mb-1'>
                        {hasFilters ? 'No matching problem set' : 'No problem sets yet'}
                    </h3>
                    <p className='text-slate-400 text-sm mb-6'>
                        {hasFilters
                            ? 'Try changing your search.'
                            : canManage ? 'Create the first problem set for this class.' : 'Nothing has been published yet.'}
                    </p>
                    {canManage && !hasFilters && (
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
            ) : (
                <div className='bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-x-auto'>
                    <table className='w-full text-left'>
                        <thead>
                            <tr className='text-sm font-bold text-slate-900 border-b border-slate-200'>
                                <th className='pb-3 pr-70'>Title</th>
                                <th className='pb-3 pr-4'>Points</th>
                                <th className='pb-3 pr-4'>Needed For</th>
                                <th className='pb-3 pr-4'>Status</th>
                                <th className='pb-3 pr-4'>Created At</th>
                                <th className='pb-3 pr-4'>Ends At</th>
                                <th className='pb-3 text-right'>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sets.map((set) => (
                                <tr key={set.id} className='border-b border-slate-100 last:border-0'>
                                    <td className='py-4 pr-4'>
                                        <button
                                            onClick={() => navigate(primaryPath(set))}
                                            className='text-sm font-semibold text-purple-600 hover:text-purple-700 hover:underline text-left'
                                        >
                                            {set.title}
                                        </button>
                                        <p className='text-xs text-slate-400'>by {set.author_name}</p>
                                    </td>
                                    <td className='py-4 pr-4 text-sm text-slate-600'>{set.total_points ?? 0}</td>
                                    <td className='py-4 pr-4'>
                                        {set.achievement_badge ? (
                                            <img
                                                src={`${BASE_URL}/uploads/problem-set-badges/${set.achievement_badge}`}
                                                alt={set.achievement_title || 'Achievement badge'}
                                                title={set.achievement_title || 'Achievement badge'}
                                                className='w-8 h-8 rounded-full object-cover border border-slate-200'
                                            />
                                        ) : (
                                            <span className='text-sm text-slate-400'>-</span>
                                        )}
                                    </td>
                                    <td className='py-4 pr-4'>
                                        {!canManage && set.my_attempt ? (
                                            <span className='px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700'>
                                                Submitted
                                            </span>
                                        ) : (
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                                                set.status === 'published'
                                                    ? 'bg-purple-100 text-purple-700'
                                                    : 'bg-amber-100 text-amber-700'
                                            }`}>
                                                {set.status}
                                            </span>
                                        )}
                                    </td>
                                    <td className='py-4 pr-4 text-sm text-slate-600'>{moment(set.created_at).format('M/D/YYYY')}</td>
                                    <td className='py-4 pr-4 text-sm text-slate-600'>
                                        {set.achievement_expiry ? moment(set.achievement_expiry).format('M/D/YYYY') : '-'}
                                    </td>
                                    <td className='py-4'>
                                        <div className='flex items-center justify-end gap-2'>
                                            {canManage ? (
                                                <>
                                                    <button
                                                        onClick={() => navigate(`/classes/${classData.id}/problem-sets/${set.id}`)}
                                                        className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 text-xs font-semibold hover:bg-slate-100 transition-colors'
                                                    >
                                                        <Pencil className='w-3.5 h-3.5' />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteTarget(set)}
                                                        className='w-8 h-8 flex items-center justify-center rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors'
                                                        aria-label='Delete problem set'
                                                    >
                                                        <Trash2 className='w-3.5 h-3.5' />
                                                    </button>
                                                </>
                                            ) : set.my_attempt ? (
                                                <button
                                                    onClick={() => navigate(`/classes/${classData.id}/problem-sets/${set.id}/attempt/result`)}
                                                    className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 text-xs font-semibold hover:bg-purple-100 transition-colors'
                                                >
                                                    <Eye className='w-3.5 h-3.5' />
                                                    View Submission
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => navigate(`/classes/${classData.id}/problem-sets/${set.id}/attempt`)}
                                                    className='px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-colors'
                                                >
                                                    Attempt
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

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
