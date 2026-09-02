import React, { useState, useEffect } from "react";
import { Plus, Trash2, CircleQuestionMarkIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import quizService from "../../services/QuizService";
import moment from 'moment';
import Spinner from '../../components/common/Spinner';
import QuizCard from '../../components/quizzes/QuizCard';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';

const QuizListPage = () => {
    const [loading, setLoading] = useState(true);
    const [quizzes, setQuizzes] = useState([]);
    const navigate = useNavigate();

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [selectedQuiz, setSelectedQuiz] = useState(null);

    const fetchAllQuizzes = async () => {
        try {
            const data = await quizService.getAllQuizzes();
            setQuizzes(Array.isArray(data?.data) ? data.data : []);

        } catch (error) {
            toast.error("Failed to fetch quizzes at the quiz list page.");
            console.error(error);

        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchAllQuizzes();
    }, []);

    const handleDeleteRequest = (quiz) => {
        setSelectedQuiz(quiz);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        setDeleting(true);

        try {
            await quizService.deleteQuiz(selectedQuiz.id);
            toast.success(`"${selectedQuiz.title}" deleted successfully.`);
            setIsDeleteModalOpen(false);
            setSelectedQuiz(null);
            setQuizzes(quizzes.filter((q) => q.id !== selectedQuiz.id));

        } catch (error) {
            toast.error("Failed to delete the quiz at the quiz list page.");
            console.error(error);

        } finally {
            setDeleting(false);
        }
    }

    const renderAllQuizzesContent = () => {
        if (loading) {
            return <div className='flex justify-center py-12'><Spinner /></div>;
        }

        if (quizzes.length === 0) {
            return (
                <EmptyState
                    title="No quizzes created yet."
                    description="Create quizzes based on your document to test your understanding."
                />
            );
        }

        return (
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
                {quizzes.map((quiz) => (
                    <QuizCard
                        key={quiz.id}
                        quiz={quiz}
                        onDelete={() => handleDeleteRequest(quiz)}
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
                    <CircleQuestionMarkIcon className='w-7 h-7 text-purple-600' strokeWidth={2} />
                </div>
                <div>
                    <h1 className='text-2xl font-bold text-slate-900'>My Quizzes</h1>
                    <p className='text-sm text-slate-500'>Review and retake quizzes generated from your documents.</p>
                </div>
            </div>

            {renderAllQuizzesContent()}

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete Quiz"
            >
                <div className='space-y-4'>
                    <p className='text-sm text-slate-600'>
                        Are you sure you want to delete{' '}
                        <span className='font-semibold'>"{selectedQuiz?.title}"</span>? This action cannot be undone.
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

export default QuizListPage;