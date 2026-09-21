import React, { useState, useEffect } from 'react';
import { Navigate, useOutletContext } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, Ban, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import moment from 'moment';
import classService from '../../services/ClassService';
import Spinner from '../../components/common/Spinner';

//The database calls an accepted member "approved", the table shows it as "active" like User Management does.
const STATUS_LABELS = { pending: 'pending', approved: 'active', deactivated: 'deactivated' };
const STATUS_STYLES = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-purple-100 text-purple-700',
    deactivated: 'bg-red-500 text-white'
};

//Only the owner (or an admin) may open Permission. Students who type the URL are sent back to Announcement.
const ClassPermissionPage = () => {
    const { classData, setClassData } = useOutletContext();
    const isOwner = classData.class_role === 'owner';

    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busyUserId, setBusyUserId] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [deactivateTarget, setDeactivateTarget] = useState(null);
    const [deactivating, setDeactivating] = useState(false);

    //Filters are left empty by default so the table shows everyone until the owner actively narrows it down.
    const [usernameFilter, setUsernameFilter] = useState('');
    const [emailFilter, setEmailFilter] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const fetchMembers = async (filters = {}) => {
        try {
            const data = await classService.getClassMembers(classData.id, filters);
            setMembers(Array.isArray(data?.data) ? data.data : []);

        } catch (error) {
            toast.error(error.error || "Failed to fetch the class members.");
            console.error(error);

        } finally {
            setLoading(false);
        }
    };

    //Runs once on mount, then again (debounced) whenever any filter changes.
    useEffect(() => {
        if (!isOwner) return;

        const timeout = setTimeout(() => {
            fetchMembers({ username: usernameFilter, email: emailFilter, role: roleFilter, startDate, endDate });
        }, 400);
        return () => clearTimeout(timeout);
    }, [usernameFilter, emailFilter, roleFilter, startDate, endDate]);

    //The sidebar/class header shows the joined count, so keep it in step with approvals and removals.
    const adjustMemberCount = (delta) => {
        setClassData((prev) => ({ ...prev, member_count: Math.max(0, prev.member_count + delta) }));
    };

    if (!isOwner) {
        return <Navigate to={`/classes/${classData.id}/announcement`} replace />;
    }

    //Approve a pending request, or activate a deactivated member.
    const handleApprove = async (member) => {
        setBusyUserId(member.id);
        try {
            await classService.approveClassMember(classData.id, member.id);
            const verb = member.status === 'deactivated' ? 'activated' : 'approved';
            toast.success(`"${member.username}" ${verb} successfully.`);
            setMembers((prev) => prev.map((m) => m.id === member.id ? { ...m, status: 'approved' } : m));
            adjustMemberCount(1);

        } catch (error) {
            toast.error(error.error || "Failed to update the member's status.");
            console.error(error);

        } finally {
            setBusyUserId(null);
        }
    };

    const handleConfirmDeactivate = async () => {
        setDeactivating(true);
        try {
            await classService.deactivateClassMember(classData.id, deactivateTarget.id);
            toast.success(`"${deactivateTarget.username}" deactivated successfully.`);
            setMembers((prev) => prev.map((m) => m.id === deactivateTarget.id ? { ...m, status: 'deactivated' } : m));
            adjustMemberCount(-1);
            setDeactivateTarget(null);

        } catch (error) {
            toast.error(error.error || "Failed to deactivate the member.");
            console.error(error);

        } finally {
            setDeactivating(false);
        }
    };

    const handleConfirmDelete = async () => {
        setDeleting(true);
        try {
            await classService.removeClassMember(classData.id, deleteTarget.id);
            toast.success(`"${deleteTarget.username}" removed successfully.`);
            setMembers((prev) => prev.filter((m) => m.id !== deleteTarget.id));
            if (deleteTarget.status === 'approved') adjustMemberCount(-1);
            setDeleteTarget(null);

        } catch (error) {
            toast.error(error.error || "Failed to remove the member.");
            console.error(error);

        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return <div className='flex justify-center py-12'><Spinner /></div>;
    }

    return (
        <div className='space-y-6'>
            {/* Header */}
            <div className='flex items-center gap-4'>
                <div className='w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0'>
                    <ShieldCheck className='w-7 h-7 text-purple-600' strokeWidth={2} />
                </div>
                <div>
                    <h2 className='text-2xl font-bold text-slate-900'>Permission</h2>
                    <p className='text-sm text-slate-500'>Approve join requests and manage who can access this class.</p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-end gap-4 w-full">
                <div className="flex-1 min-w-[160px] flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">Username:</label>
                    <input
                        type="text"
                        value={usernameFilter}
                        onChange={(e) => setUsernameFilter(e.target.value)}
                        className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
                    />
                </div>

                <div className="flex-1 min-w-[180px] flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">Email:</label>
                    <input
                        type="text"
                        value={emailFilter}
                        onChange={(e) => setEmailFilter(e.target.value)}
                        className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
                    />
                </div>

                <div className="flex-1 min-w-[150px] flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">Role:</label>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
                    >
                        <option value="">All Roles</option>
                        <option value="student">Student</option>
                        <option value="lecturer">Lecturer</option>
                        <option value="parents">Parent</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>

                <div className="flex-[1.6] min-w-[280px] flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">Requested At:</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="flex-1 h-10 px-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
                        />
                        <span className="text-sm text-slate-500 shrink-0">to</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="flex-1 h-10 px-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-sm font-bold text-slate-900 border-b border-slate-200">
                            <th className="pb-3 pr-4">Username</th>
                            <th className="pb-3 pr-4">Email</th>
                            <th className="pb-3 pr-4">Role</th>
                            <th className="pb-3 pr-4">Status</th>
                            <th className="pb-3 pr-4">Requested</th>
                            <th className="pb-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {members.length === 0 && (
                            <tr>
                                <td colSpan={6} className="py-6 text-sm text-slate-400 text-center">No join requests found.</td>
                            </tr>
                        )}

                        {members.map((row) => {
                            const isBusy = busyUserId === row.id;

                            return (
                                <tr key={row.id} className="border-b border-slate-100 last:border-0">
                                    <td className="py-4 pr-4 text-sm font-semibold text-slate-900">{row.username}</td>
                                    <td className="py-4 pr-4 text-sm text-slate-600">{row.email}</td>
                                    <td className="py-4 pr-4">
                                        <span className='px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 capitalize'>
                                            {row.role}
                                        </span>
                                    </td>
                                    <td className="py-4 pr-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[row.status] || 'bg-slate-100 text-slate-600'}`}>
                                            {STATUS_LABELS[row.status] || row.status}
                                        </span>
                                    </td>
                                    <td className="py-4 pr-4 text-sm text-slate-600">{moment(row.created_at).format("M/D/YYYY")}</td>
                                    <td className="py-4">
                                        <div className='flex items-center justify-end gap-2'>
                                            {row.status === 'pending' && (
                                                <button
                                                    onClick={() => handleApprove(row)}
                                                    disabled={isBusy}
                                                    className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border borde-purple-200 bg-purple-50 text-purple-700 text-xs font-semibold hover:bg-purple-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
                                                >
                                                    <CheckCircle2 className='w-3.5 h-3.5' />
                                                    Approve
                                                </button>
                                            )}
                                            {row.status === 'approved' && (
                                                <button
                                                    onClick={() => setDeactivateTarget(row)}
                                                    disabled={isBusy}
                                                    className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 text-xs font-semibold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
                                                >
                                                    <Ban className='w-3.5 h-3.5' />
                                                    Deactivate
                                                </button>
                                            )}
                                            {row.status === 'deactivated' && (
                                                <button
                                                    onClick={() => handleApprove(row)}
                                                    disabled={isBusy}
                                                    className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 text-xs font-semibold hover:bg-purple-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
                                                >
                                                    <CheckCircle2 className='w-3.5 h-3.5' />
                                                    Activate
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setDeleteTarget(row)}
                                                disabled={isBusy}
                                                className='w-8 h-8 flex items-center justify-center rounded-lg bg-red-500 hover:bg-red-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
                                            >
                                                <Trash2 className='w-3.5 h-3.5' />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Remove Confirmation Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                                <Trash2 className="w-5 h-5 text-red-500" />
                            </div>
                            <h2 className="text-lg font-semibold text-slate-800">
                                {deleteTarget.status === 'pending' ? 'Reject Request' : 'Remove Member'}
                            </h2>
                        </div>
                        <p className="text-sm text-slate-500 mb-6">
                            Are you sure you want to {deleteTarget.status === 'pending' ? 'reject the request from' : 'remove'} <span className="font-medium text-slate-700">"{deleteTarget.username}"</span>?
                            They will need to send a new join request to enter this class again.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                disabled={deleting}
                                className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={deleting}
                                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                {deleting ? 'Removing...' : deleteTarget.status === 'pending' ? 'Reject' : 'Remove'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Deactivate Confirmation Modal */}
            {deactivateTarget && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center">
                                <Ban className="w-5 h-5 text-amber-500" />
                            </div>
                            <h2 className="text-lg font-semibold text-slate-800">Deactivate Member</h2>
                        </div>
                        <p className="text-sm text-slate-500 mb-6">
                            Are you sure you want to deactivate <span className="font-medium text-slate-700">"{deactivateTarget.username}"</span>?
                            They will not be able to open this class until you activate them again.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeactivateTarget(null)}
                                disabled={deactivating}
                                className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDeactivate}
                                disabled={deactivating}
                                className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                {deactivating ? 'Deactivating...' : 'Deactivate'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClassPermissionPage;
