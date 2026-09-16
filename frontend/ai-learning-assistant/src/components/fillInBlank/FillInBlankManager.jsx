import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

import fillInBlankService from "../../services/FillInBlankService";
import aiService from '../../services/AIService';
import Spinner from '../common/Spinner';
import Button from '../common/Button';
import FillInBlankCard from './FillInBlankCard';
import EmptyState from '../common/EmptyState';
import Modal from '../common/Modal';

const FillInBlankManager = ({ documentId }) => {
    const [sets, setSets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
    const [numOfQuestions, setNumOfQuestions] = useState(5);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [selectedSet, setSelectedSet] = useState(null);

    const fetchSets = async () => {
        setLoading(true);

        try {
            const data = await fillInBlankService.getSetsForDocument(documentId);
            setSets(data.data);

        } catch (error) {
            toast.error("Fail to fetch the fill-in-the-blank sets at the frontend.");
            console.error(error);

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (documentId) {
            fetchSets();
        }
    }, [documentId]);

    const handleSetGenerated = async (x) => {
        x.preventDefault();
        setGenerating(true);

        try {
            await aiService.generateFillInBlank(documentId, { numOfQuestions });
            toast.success("Fill-in-the-blank set generated successfully.");
            setIsGenerateModalOpen(false);
            fetchSets();

        } catch (error) {
            toast.error(error.message || "Failed to generate the fill-in-the-blank set at the frontend.");

        } finally {
            setGenerating(false);
        }
    };

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
            toast.error("Failed to delete the fill-in-the-blank set.");
            console.error(error);

        } finally {
            setDeleting(false);
        }
    };

    const renderSetContent = () => {
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
    };

    return (
        <div className='bg-white border border-neutral-200 rounded-lg p-6'>
            <div className='flex justify-end gap-2 mb-4'>
                <Button onClick={() => setIsGenerateModalOpen(true)}>
                    <Plus size={16} />
                    Generate Fill-In-The-Blank
                </Button>
            </div>
            {renderSetContent()}

            {/* Generate Set */}
            <Modal
                isOpen={isGenerateModalOpen}
                onClose={() => setIsGenerateModalOpen(false)}
                title="Generate New Fill-In-The-Blank Set"
            >
                <form onSubmit={handleSetGenerated} className='space-y-4'>
                    <div>
                        <label className='block text-xs font-medium text-neutral-700 mb-1.5'>
                            Number of Questions
                        </label>
                        <input
                            type="number"
                            value={numOfQuestions}
                            onChange={(e) => setNumOfQuestions(Math.max(1, parseInt(e.target.value) || 1))}
                            min="1"
                            required
                            className='w-full h-9 px-3 border border-neutral-200 rounded-lg bg-white text-sm text-neutral-900 placeholder-neutral-400 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[purple] focus:border-transparent'
                        />
                    </div>
                    <div className='flex justify-end gap-2 pt-2'>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setIsGenerateModalOpen(false)}
                            disabled={generating}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={generating}
                        >
                            {generating ? 'Generating...' : 'Generate'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                                <Trash2 className="w-5 h-5 text-red-500" />
                            </div>
                            <h2 className="text-lg font-semibold text-slate-800">Delete Set</h2>
                        </div>
                        <p className="text-sm text-slate-500 mb-6">
                            Are you sure you want to delete <span className="font-medium text-slate-700">"{selectedSet?.title}"</span>? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
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
        </div>
    );
}

export default FillInBlankManager;
