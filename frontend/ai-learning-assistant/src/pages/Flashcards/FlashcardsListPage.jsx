import React, { useState, useEffect } from "react";
import { Brain, ClipboardListIcon } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import flashcardService from "../../services/FlashcardService";
import Spinner from "../../components/common/Spinner";
import EmptyState from "../../components/common/EmptyState";
import Modal from "../../components/common/Modal";
import FlashcardSetCard from "../../components/flashcards/FlashcardSetCard";

const FlashcardsListPage = () => {
    const [loading, setLoading] = useState(true);
    const [flashcardSets, setFlashcardSets] = useState([]);
    const navigate = useNavigate();

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [selectedSet, setSelectedSet] = useState(null);

    const fetchAllFlashcards = async () => {
        try {
            const data = await flashcardService.getAllFlashcards();
            setFlashcardSets(Array.isArray(data?.data) ? data.data : []);
        } catch (error) {
            toast.error("Failed to fetch flashcards at the flashcard list page.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllFlashcards();
    }, []);

    const handleStudy = (set) => {
        navigate(`/documents/${set.document_id}`, {
            state: { tab: "Flashcard", flashcardSetId: set.id },
        });
    };

    const handleDeleteRequest = (set) => {
        setSelectedSet(set);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        setDeleting(true);
        try {
            await flashcardService.deleteFlashcard(selectedSet.id);
            toast.success("Flashcard set deleted successfully.");
            setIsDeleteModalOpen(false);
            setFlashcardSets((prev) => prev.filter((s) => s.id !== selectedSet.id));
            setSelectedSet(null);
        } catch (error) {
            toast.error("Failed to delete the flashcard set.");
            console.error(error);
        } finally {
            setDeleting(false);
        }
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex justify-center py-12">
                    <Spinner />
                </div>
            );
        }

        if (flashcardSets.length === 0) {
            return (
                <EmptyState
                    title="No flashcards created yet."
                    description="Generate flashcards from your documents to start studying."
                />
            );
        }

        return (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {flashcardSets.map((set) => (
                    <FlashcardSetCard
                        key={set.id}
                        set={set}
                        onStudy={handleStudy}
                        onDelete={handleDeleteRequest}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-purple-100">
                    <ClipboardListIcon className="h-7 w-7 text-purple-600" strokeWidth={2} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">My Flashcards</h1>
                    <p className="text-sm text-slate-500">
                        Review and study flashcard sets generated from your documents.
                    </p>
                </div>
            </div>

            {renderContent()}

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete Flashcard Set"
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">
                        Are you sure you want to delete{" "}
                        <span className="font-semibold">
                            "{selectedSet?.title ? `Flashcard - ${selectedSet.title}` : "Flashcard Set"}"
                        </span>
                        ? This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-3 pt-1">
                        <button
                            onClick={() => setIsDeleteModalOpen(false)}
                            disabled={deleting}
                            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirmDelete}
                            disabled={deleting}
                            className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-red-600 disabled:opacity-50"
                        >
                            {deleting ? "Deleting..." : "Delete"}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default FlashcardsListPage;
