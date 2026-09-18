import React, { useState, useEffect } from "react";
import { Users, CheckCircle2, Ban, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import moment from 'moment';
import authService from '../../services/AuthService';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/common/Spinner';

const STATUS_STYLES = {
    pending: 'bg-yellow-100 text-yellow-700',
    active: 'bg-purple-100 text-purple-700',
    deactivated: 'bg-red-100 text-red-700'
};

const UserManagementPage = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busyUserId, setBusyUserId] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [deactivateTarget, setDeactivateTarget] = useState(null);
    const [deactivating, setDeactivating] = useState(false);

    const fetchUsers = async () => {
        try {
            const data = await authService.getAllUsersForAdmin();
            setUsers(Array.isArray(data?.data) ? data.data : []);

        } catch (error) {
            toast.error("Failed to fetch users.");
            console.error(error);

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleApprove = async (targetUser) => {
        setBusyUserId(targetUser.id);
        try {
            await authService.approveUser(targetUser.id);
            toast.success(`"${targetUser.username}" approved successfully.`);
            setUsers((prev) => prev.map((u) => u.id === targetUser.id ? { ...u, status: 'active' } : u));

        } catch (error) {
            toast.error(error.error || "Failed to approve the user.");
            console.error(error);

        } finally {
            setBusyUserId(null);
        }
    };

    const handleConfirmDeactivate = async () => {
        setDeactivating(true);
        try {
            await authService.deactivateUser(deactivateTarget.id);
            toast.success(`"${deactivateTarget.username}" deactivated successfully.`);
            setUsers((prev) => prev.map((u) => u.id === deactivateTarget.id ? { ...u, status: 'deactivated' } : u));
            setDeactivateTarget(null);

        } catch (error) {
            toast.error(error.error || "Failed to deactivate the user.");
            console.error(error);

        } finally {
            setDeactivating(false);
        }
    };

    const handleConfirmDelete = async () => {
        setDeleting(true);
        try {
            await authService.deleteUserByAdmin(deleteTarget.id);
            toast.success(`"${deleteTarget.username}" deleted successfully.`);
            setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
            setDeleteTarget(null);

        } catch (error) {
            toast.error(error.error || "Failed to delete the user.");
            console.error(error);

        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return <div className='flex justify-center py-12'><Spinner /></div>;
    }

    return (
        <div className='max-w-6xl mx-auto space-y-6'>
            {/* Header */}
            <div className='flex items-center gap-4'>
                <div className='w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0'>
                    <Users className='w-7 h-7 text-purple-600' strokeWidth={2} />
                </div>
                <div>
                    <h1 className='text-2xl font-bold text-slate-900'>User Management</h1>
                    <p className='text-sm text-slate-500'>Manage user accounts and approve pending registrations.</p>
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
                            <th className="pb-3 pr-4">Created</th>
                            <th className="pb-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 && (
                            <tr>
                                <td colSpan={6} className="py-6 text-sm text-slate-400 text-center">No users found.</td>
                            </tr>
                        )}

                        {users.map((row) => {
                            const isSelf = row.id === currentUser?.id;
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
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className="py-4 pr-4 text-sm text-slate-600">{moment(row.created_at).format("M/D/YYYY")}</td>
                                    <td className="py-4">
                                        <div className='flex items-center justify-end gap-2'>
                                            {row.status === 'pending' ? (
                                                <button
                                                    onClick={() => handleApprove(row)}
                                                    disabled={isSelf || isBusy}
                                                    className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-green-200 bg-green-50 text-green-700 text-xs font-semibold hover:bg-green-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
                                                >
                                                    <CheckCircle2 className='w-3.5 h-3.5' />
                                                    Approve
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => setDeactivateTarget(row)}
                                                    disabled={isSelf || isBusy || row.status === 'deactivated'}
                                                    className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 text-xs font-semibold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
                                                >
                                                    <Ban className='w-3.5 h-3.5' />
                                                    Deactivate
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setDeleteTarget(row)}
                                                disabled={isSelf}
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

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                                <Trash2 className="w-5 h-5 text-red-500" />
                            </div>
                            <h2 className="text-lg font-semibold text-slate-800">Delete User</h2>
                        </div>
                        <p className="text-sm text-slate-500 mb-6">
                            Are you sure you want to delete <span className="font-medium text-slate-700">"{deleteTarget.username}"</span>?
                            This will permanently remove their account and all their data. This action cannot be undone.
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
                                {deleting ? 'Deleting...' : 'Delete'}
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
                            <h2 className="text-lg font-semibold text-slate-800">Deactivate User</h2>
                        </div>
                        <p className="text-sm text-slate-500 mb-6">
                            Are you sure you want to deactivate <span className="font-medium text-slate-700">"{deactivateTarget.username}"</span>?
                            They will not be able to log in until an admin approves them again.
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

export default UserManagementPage;
