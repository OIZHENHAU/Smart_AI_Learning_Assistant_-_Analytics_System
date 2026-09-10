import React, { useState, useEffect } from 'react';
import { Plus, ChevronLeft, ChevronRight, Trash2, ArrowLeft, Sparkles, Brain, Play, ClipboardListIcon } from "lucide-react";
import toast from "react-hot-toast";
import moment from "moment";

import flashcardService from "../../services/FlashcardService";
import aiService from "../../services/AIService";
import Spinner from "../common/Spinner";
import Button from "../common/Button";
import Flashcard from "./Flashcard";

const FlashcardManager = ({ documentId, initialSetId }) => {
    const [flashcardSets, setFlashcardSets] = useState([]);
    const [selectedSet, setSelectedSet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [setToDelete, setSetToDelete] = useState(null);

    const fetchFlashcardSets = async () => {
        setLoading(true);
        try {
            const response = await flashcardService.getFlashcardDocument(documentId);
            const sets = response.data || [];
            setFlashcardSets(sets);

            if (initialSetId) {
                const match = sets.find((s) => String(s.id) === String(initialSetId));
                if (match) {
                    setSelectedSet(match);
                    setCurrentCardIndex(0);
                }
            }

        } catch (error) {
            toast.error("Failed to load flashcards for this document.");
            console.error(error);
            
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (documentId) {
            fetchFlashcardSets();
        }
    }, [documentId]);

    const handleGenerateFlashcards = async () => {
        setGenerating(true);
        try {
            await aiService.generateFlashcard(documentId);
            toast.success("Flashcards generated successfully.");
            fetchFlashcardSets();
        } catch (error) {
            toast.error(error.message || "Failed to generate flashcards.");
        } finally {
            setGenerating(false);
        }
    };

    const handleSelectSet = (set) => {
        setSelectedSet(set);
        setCurrentCardIndex(0);
    };

    const handleBackToSets = () => {
        setSelectedSet(null);
        setCurrentCardIndex(0);
    };

    const reviewCurrentCard = async (card) => {
        if (!card) return;
        try {
            await flashcardService.reviewFlashcard(card.id);
        } catch (error) {
            console.error("Failed to record flashcard review:", error);
        }
    };

    const handleNextCard = () => {
        const cards = selectedSet?.cards || [];
        if (!cards.length) return;
        reviewCurrentCard(cards[currentCardIndex]);
        setCurrentCardIndex((prev) => (prev + 1) % cards.length);
    };

    const handlePrevCard = () => {
        const cards = selectedSet?.cards || [];
        if (!cards.length) return;
        reviewCurrentCard(cards[currentCardIndex]);
        setCurrentCardIndex((prev) => (prev - 1 + cards.length) % cards.length);
    };

    const handleToggleStar = async (cardId) => {
        const toggleIn = (cards = []) =>
            cards.map((card) =>
                card.id === cardId ? { ...card, is_started: card.is_started ? 0 : 1 } : card
            );

        setSelectedSet((prev) => (prev ? { ...prev, cards: toggleIn(prev.cards) } : prev));
        setFlashcardSets((prev) => prev.map((set) => ({ ...set, cards: toggleIn(set.cards) })));

        try {
            await flashcardService.toggleStarOnFlashcard(cardId);
        } catch (error) {
            toast.error("Failed to update the star on this flashcard.");
            console.error(error);
            
            setSelectedSet((prev) => (prev ? { ...prev, cards: toggleIn(prev.cards) } : prev));
            setFlashcardSets((prev) => prev.map((set) => ({ ...set, cards: toggleIn(set.cards) })));
        }
    };

    const handleDeleteRequest = (e, set) => {
        e.stopPropagation();
        setSetToDelete(set);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!setToDelete) return;
        setDeleting(true);
        try {
            await flashcardService.deleteFlashcard(setToDelete.id);
            toast.success("Flashcard set deleted successfully.");
            setFlashcardSets((prev) => prev.filter((set) => set.id !== setToDelete.id));

            if (selectedSet?.id === setToDelete.id) {
                handleBackToSets();
            }

            setIsDeleteModalOpen(false);
            setSetToDelete(null);
        } catch (error) {
            toast.error("Failed to delete the flashcard set.");
            console.error(error);
            
        } finally {
            setDeleting(false);
        }
    };

    const renderEmptyState = () => (
        <div className='flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-linear-to-br from-purple-50/40 to-white px-6 py-16 text-center'>
            <div className='mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100'>
                <Brain className='h-8 w-8 text-purple-600' />
            </div>
            <h3 className='mb-2 text-lg font-semibold text-slate-900'>No Flashcards Yet</h3>
            <p className='mb-8 max-w-sm text-sm leading-relaxed text-slate-500'>
                Generate flashcards from your document to start learning and reinforce your knowledge.
            </p>
            <Button onClick={handleGenerateFlashcards} disabled={generating}>
                <Sparkles size={16} />
                {generating ? "Generating..." : "Generate Flashcards"}
            </Button>
        </div>
    );

    const renderSetList = () => (
        <div>
            <div className='mb-6 flex items-start justify-between gap-4'>
                <div>
                    <h3 className='text-lg font-semibold text-slate-900'>Your Flashcards</h3>
                    <p className='mt-1 text-sm text-slate-500'>
                        {flashcardSets.length} {flashcardSets.length === 1 ? "set" : "sets"} available
                    </p>
                </div>
                <Button onClick={handleGenerateFlashcards} disabled={generating}>
                    <Plus size={16} />
                    {generating ? "Generating..." : "Generate Flashcard"}
                </Button>
            </div>

            <div className='grid grid-cols-[repeat(auto-fill,minmax(240px,280px))] gap-4'>
                {flashcardSets.map((set) => (
                    <div
                        key={set.id}
                        className='group relative flex flex-col justify-between rounded-2xl border-2 border-slate-200 bg-white p-5 transition-all duration-200 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/10'
                    >
                        <button
                            type='button'
                            onClick={(e) => handleDeleteRequest(e, set)}
                            className='absolute right-4 top-4 rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500'
                            aria-label='Delete flashcard set'
                        >
                            <Trash2 className='h-4 w-4' />
                        </button>

                        <div>
                            <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100'>
                                <ClipboardListIcon className='h-6 w-6 text-purple-600' />
                            </div>

                            <h4
                                className='text-base font-semibold text-slate-900 line-clamp-2'
                                title={set.title ? `Flashcard - ${set.title}` : 'Flashcard Set'}
                            >
                                {set.title ? `Flashcard - ${set.title}` : 'Flashcard Set'}
                            </h4>
                            <p className='mt-1 text-xs font-medium uppercase tracking-wide text-slate-500'>
                                Created {moment(set.created_at).format("MMM D, YYYY")}
                            </p>

                            <div className='mt-4 border-t border-slate-100 pt-4'>
                                <span className='inline-flex rounded-lg bg-purple-50 px-3 py-1.5 text-sm font-semibold text-purple-700'>
                                    {set.cards?.length || 0} cards
                                </span>
                            </div>
                        </div>

                        <div className='mt-4 border-t border-slate-100 pt-4'>
                            <button
                                type='button'
                                onClick={() => handleSelectSet(set)}
                                className='group/btn relative w-full h-11 bg-linear-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-purple-500/25 active:scale-95 overflow-hidden'
                            >
                                <span className='relative z-10 flex items-center justify-center gap-2'>
                                    <Play className='h-4 w-4' />
                                    Study Flashcards
                                </span>
                                <div className='absolute inset-0 bg-linear-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700' />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderFlashcardViewer = () => {
        const cards = selectedSet?.cards || [];
        const currentCard = cards[currentCardIndex];

        return (
            <div>
                <button
                    type='button'
                    onClick={handleBackToSets}
                    className='mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-purple-600'
                >
                    <ArrowLeft className='h-4 w-4' />
                    Back to Sets
                </button>

                {currentCard ? (
                    <>
                        <Flashcard
                            key={currentCard.id}
                            flashcard={currentCard}
                            onToggleStar={handleToggleStar}
                        />

                        <div className='mt-8 flex items-center justify-center gap-3'>
                            <button
                                type='button'
                                onClick={handlePrevCard}
                                className='inline-flex items-center gap-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-purple-50 hover:text-purple-600'
                            >
                                <ChevronLeft className='h-4 w-4' />
                                Previous
                            </button>
                            <span className='rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700'>
                                {currentCardIndex + 1} / {cards.length}
                            </span>
                            <button
                                type='button'
                                onClick={handleNextCard}
                                className='inline-flex items-center gap-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-purple-50 hover:text-purple-600'
                            >
                                Next
                                <ChevronRight className='h-4 w-4' />
                            </button>
                        </div>
                    </>
                ) : (
                    <p className='py-12 text-center text-sm text-slate-500'>This set has no cards.</p>
                )}
            </div>
        );
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className='flex justify-center py-12'>
                    <Spinner />
                </div>
            );
        }
        if (selectedSet) {
            return renderFlashcardViewer();
        }
        if (flashcardSets.length === 0) {
            return renderEmptyState();
        }
        return renderSetList();
    };

    return (
        <div className='rounded-2xl border border-slate-200 bg-white p-6 shadow-sm'>
            {renderContent()}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
                    <div className='w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl'>
                        <div className='mb-4 flex items-center gap-3'>
                            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-red-50'>
                                <Trash2 className='h-5 w-5 text-red-500' />
                            </div>
                            <h2 className='text-lg font-semibold text-slate-800'>Delete Flashcard Set</h2>
                        </div>
                        <p className='mb-6 text-sm text-slate-500'>
                            Are you sure you want to delete this flashcard set? This action cannot be undone.
                        </p>
                        <div className='flex gap-3'>
                            <button
                                type='button'
                                onClick={() => setIsDeleteModalOpen(false)}
                                disabled={deleting}
                                className='flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50'
                            >
                                Cancel
                            </button>
                            <button
                                type='button'
                                onClick={handleConfirmDelete}
                                disabled={deleting}
                                className='flex-1 rounded-lg bg-red-500 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-60'
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

export default FlashcardManager;
