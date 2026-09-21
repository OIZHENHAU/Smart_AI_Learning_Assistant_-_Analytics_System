import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import classDocumentService from '../../../services/ClassDocumentService';
import Spinner from '../../common/Spinner';
import CommentThread from './CommentThread';
import CommentModal from './CommentModal';
import { useAuth } from '../../../context/AuthContext';

const STAFF_ROLES = ['lecturer', 'parents', 'admin'];

//The Comment tab of a class document: a "Create Comment" button and the comment threads.
const DocumentComments = ({ classId, documentId }) => {
    const { user } = useAuth();
    const canModerate = STAFF_ROLES.includes(user?.role);

    const [threads, setThreads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null); //null = closed, { comment: null } = create, { comment } = edit
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const fetchComments = async () => {
        try {
            const result = await classDocumentService.getComments(classId, documentId);
            setThreads(Array.isArray(result?.data) ? result.data : []);

        } catch (error) {
            toast.error(error.error || "Failed to load the comments.");
            console.error(error);

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [classId, documentId]);

    const handleConfirmDelete = async () => {
        setDeleting(true);
        try {
            await classDocumentService.deleteComment(classId, documentId, deleteTarget.id);
            toast.success("Comment deleted successfully.");
            setDeleteTarget(null);
            fetchComments();

        } catch (error) {
            toast.error(error.error || "Failed to delete the comment.");
            console.error(error);

        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className='space-y-6'>
            <div className='flex justify-end'>
                <button
                    onClick={() => setModal({ comment: null })}
                    className='flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
                >
                    <Plus className='w-4 h-4' />
                    Create Comment
                </button>
            </div>

            {loading ? (
                <div className='flex justify-center py-12'><Spinner /></div>
            ) : threads.length === 0 ? (
                <p className='text-center text-sm text-slate-400 py-12'>No comments yet. Be the first to comment.</p>
            ) : (
                threads.map((thread) => (
                    <CommentThread
                        key={thread.id}
                        thread={thread}
                        classId={classId}
                        documentId={documentId}
                        currentUserId={user?.id}
                        canModerate={canModerate}
                        onEdit={(comment) => setModal({ comment })}
                        onDelete={setDeleteTarget}
                        onChanged={fetchComments}
                    />
                ))
            )}

            {modal && (
                <CommentModal
                    classId={classId}
                    documentId={documentId}
                    comment={modal.comment}
                    onClose={() => setModal(null)}
                    onSaved={fetchComments}
                />
            )}

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50'>
                    <div className='bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6'>
                        <div className='flex items-center gap-3 mb-4'>
                            <div className='w-10 h-10 bg-red-50 rounded-full flex items-center justify-center'>
                                <Trash2 className='w-5 h-5 text-red-500' />
                            </div>
                            <h2 className='text-lg font-semibold text-slate-800'>Delete Comment</h2>
                        </div>
                        <p className='text-sm text-slate-500 mb-6'>
                            Are you sure you want to delete this {deleteTarget.parent_id ? 'reply' : 'comment'}?
                            {!deleteTarget.parent_id && ' All the replies under it will be deleted too.'} This action cannot be undone.
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

export default DocumentComments;
