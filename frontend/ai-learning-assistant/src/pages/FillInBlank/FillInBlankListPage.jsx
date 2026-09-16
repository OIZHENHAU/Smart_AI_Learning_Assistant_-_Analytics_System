import React, { useState, useEffect } from "react";
import { FileQuestion } from 'lucide-react';
import toast from 'react-hot-toast';
import fillInBlankService from "../../services/FillInBlankService";
import Spinner from '../../components/common/Spinner';
import FillInBlankCard from '../../components/fillInBlank/FillInBlankCard';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';

const FillInBlankListPage = () => {
    const [loading, setLoading] = useState(true);
    const [sets, setSets] = useState([]);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [selectedSet, setSelectedSet] = useState(null);

    const fetchAllSets = async () => {
        try {
            const data = await fillInBlankService.getAllSets();
            setSets(Array.isArray(data?.data) ? data.data : []);

        } catch (error) {
            toast.error("Failed to fetch fill-in-the-blank sets at the list page.");
            console.error(error);

        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchAllSets();
    }, []);

    const handleDeleteRequest = (set) => {
        setSelectedSet(set);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        setDeleting(true);

        try {
            await fillInBlankService.deleteSet(selectedSet.id);
            toast.success(`"${selectedSet.title}" deleted successfully.`);
            setIsDeleteModalOpen(false);
            setSelectedSet(null);
            setSets(sets.filter((s) => s.id !== selectedSet.id));

        } catch (error) {
            toast.error("Failed to delete the set at the fill-in-the-blank list page.");
            console.error(error);

        } finally {
            setDeleting(false);
        }
    }

    const renderAllSetsContent = () => {
        if (loading) {
            return <div className='flex justify-center py-12'><Spinner /></div>;
        }

        if (sets.length === 0) {
            return (
                <EmptyState
                    title="No fill-in-the-blank sets created yet."
                    description="Create fill-in-the-blank exercises based on your document to test your understanding."
                />
            );
        }

        return (
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
                {sets.map((set) => (
                    <FillInBlankCard
                        key={set.id}
                        set={set}
                        onDelete={() => handleDeleteRequest(set)}
                    />
                ))}
            </div>
        );
    }

    return (
        <div className='max-w-6xl mx-auto space-y-6'>
            {/* Header */}
            <div className='flex items-center gap-4'>
                <div className='w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0'>
                    <FileQuestion className='w-7 h-7 text-purple-600' strokeWidth={2} />
                </div>
                <div>
                    <h1 className='text-2xl font-bold text-slate-900'>Fill-In Questions</h1>
                    <p className='text-sm text-slate-500'>Review and retake fill-in-the-blank sets generated from your documents.</p>
                </div>
            </div>

            {renderAllSetsContent()}

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete Set"
            >
                <div className='space-y-4'>
                    <p className='text-sm text-slate-600'>
                        Are you sure you want to delete{' '}
                        <span className='font-semibold'>"{selectedSet?.title}"</span>? This action cannot be undone.
                    </p>
                    <div className='flex justify-end gap-3 pt-1'>
                        <button
                            onClick={() => setIsDeleteModalOpen(false)}
                            disabled={deleting}
                            className='px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-all'
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirmDelete}
                            disabled={deleting}
                            className='px-4 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 rounded-xl transition-all'
                        >
                            {deleting ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

export default FillInBlankListPage;
