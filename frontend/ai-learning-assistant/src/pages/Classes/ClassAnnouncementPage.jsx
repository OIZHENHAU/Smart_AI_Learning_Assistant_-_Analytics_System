import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Megaphone, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import announcementService from '../../services/AnnouncementService';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/common/Spinner';
import Pagination from '../../components/common/Pagination';
import AnnouncementCard from '../../components/classes/Announcement/AnnouncementCard';
import AnnouncementModal from '../../components/classes/Announcement/AnnouncementModal';

const ClassAnnouncementPage = () => {
    const { classData } = useOutletContext();
    const { user } = useAuth();
    const classId = classData.id;
    const canManage = user?.role !== 'student';

    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    //Search filters, all empty by default so every announcement is shown.
    const [search, setSearch] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const hasFilters = search || startDate || endDate;

    const fetchAnnouncements = async () => {
        try {
            const data = await announcementService.getAnnouncements(classId, { search, startDate, endDate, page });
            const pages = data?.pagination?.totalPages || 1;

            if (page > pages) {
                setPage(pages);
                return;
            }

            setAnnouncements(Array.isArray(data?.data) ? data.data : []);
            setTotalPages(pages);

        } catch (error) {
            toast.error("Failed to fetch announcements.");
            console.error(error);

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(fetchAnnouncements, 400);
        return () => clearTimeout(timeout);
    }, [classId, search, startDate, endDate, page]);

    const onFilterChange = (setter) => (e) => {
        setter(e.target.value);
        setPage(1);
    };

    const handleConfirmDelete = async () => {
        setDeleting(true);
        try {
            await announcementService.deleteAnnouncement(classId, deleteTarget.id);
            toast.success("Announcement deleted successfully.");
            setDeleteTarget(null);
            fetchAnnouncements();

        } catch (error) {
            toast.error(error.error || "Failed to delete the announcement.");
            console.error(error);

        } finally {
            setDeleting(false);
        }
    };

    const handleSaved = () => {
        if (!modal.announcement && page !== 1) setPage(1);
        else fetchAnnouncements();
    };

    const renderContent = () => {
        if (loading) {
            return <div className='flex justify-center items-center py-20'><Spinner /></div>;
        }

        if (announcements.length === 0) {
            return (
                <div className='flex flex-col items-center justify-center py-24 text-center'>
                    <div className='w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4'>
                        <Megaphone className='w-8 h-8 text-purple-400' />
                    </div>
                    <h3 className='text-lg font-medium text-slate-700 mb-1'>
                        {hasFilters ? 'No matching announcement' : 'No announcement yet'}
                    </h3>
                    <p className='text-slate-400 text-sm'>
                        {hasFilters
                            ? 'Try changing your search.'
                            : canManage ? 'Create an announcement for your class.' : 'Your lecturer has not posted anything yet.'}
                    </p>
                </div>
            );
        }

        return (
            <div className='space-y-4'>
                {announcements.map((a) => (
                    <AnnouncementCard
                        key={a.id}
                        announcement={a}
                        canManage={canManage}
                        onEdit={(announcement) => setModal({ announcement })}
                        onDelete={setDeleteTarget}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className='min-h-screen p-6'>
            <div className='max-w-7xl mx-auto'>
                {/* Header */}
                <div className='flex items-center justify-between mb-8'>
                    <div className='flex items-center gap-4'>
                        <div className='w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0'>
                            <Megaphone className='w-7 h-7 text-purple-600' strokeWidth={2} />
                        </div>
                        <div>
                            <h1 className='text-2xl font-bold text-slate-900'>Announcement</h1>
                            <p className='text-sm text-slate-500'>Post and read class announcements.</p>
                        </div>
                    </div>
                    {canManage && (
                        <button
                            onClick={() => setModal({ announcement: null })}
                            className='flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
                        >
                            <Plus className='w-4 h-4' />
                            Create Announcement
                        </button>
                    )}
                </div>

                {/* Search bar */}
                <div className='flex flex-wrap items-end gap-4 w-full mb-8'>
                    <div className='flex-1 min-w-[220px] flex flex-col gap-1.5'>
                        <label className='text-sm font-medium text-slate-700'>Title or Content:</label>
                        <input
                            type='text'
                            value={search}
                            onChange={onFilterChange(setSearch)}
                            className='w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400'
                        />
                    </div>
                    <div className='flex-[1.4] min-w-[280px] flex flex-col gap-1.5'>
                        <label className='text-sm font-medium text-slate-700'>Created At:</label>
                        <div className='flex items-center gap-2'>
                            <input
                                type='date'
                                value={startDate}
                                onChange={onFilterChange(setStartDate)}
                                className='flex-1 h-10 px-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400'
                            />
                            <span className='text-sm text-slate-500 shrink-0'>to</span>
                            <input
                                type='date'
                                value={endDate}
                                onChange={onFilterChange(setEndDate)}
                                className='flex-1 h-10 px-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400'
                            />
                        </div>
                    </div>
                </div>

                <div className='mb-6'>
                    <Pagination page={page} totalPages={totalPages} onChange={setPage} />
                </div>

                {renderContent()}
            </div>

            {modal && (
                <AnnouncementModal
                    classId={classId}
                    announcement={modal.announcement}
                    onClose={() => setModal(null)}
                    onSaved={handleSaved}
                />
            )}

            {/* Delete confirmation */}
            {deleteTarget && (
                <div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50'>
                    <div className='bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6'>
                        <div className='flex items-center gap-3 mb-4'>
                            <div className='w-10 h-10 bg-red-50 rounded-full flex items-center justify-center'>
                                <Trash2 className='w-5 h-5 text-red-500' />
                            </div>
                            <h2 className='text-lg font-semibold text-slate-800'>Delete Announcement</h2>
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

export default ClassAnnouncementPage;
