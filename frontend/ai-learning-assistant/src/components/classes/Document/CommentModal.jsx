import React, { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import RichTextEditor from '../RichTextEditor';
import classDocumentService from '../../../services/ClassDocumentService';

//comment = null creates a new thread, otherwise the given thread (or reply) is edited.
//Render it only while it is open, so the editor always starts from the saved content.
const CommentModal = ({ classId, documentId, comment, onClose, onSaved }) => {
    const isReply = !!comment?.parent_id;
    const [title, setTitle] = useState(comment?.title || '');
    const [content, setContent] = useState(comment?.content || '');
    const [saving, setSaving] = useState(false);

    const handlePost = async (e) => {
        e.preventDefault();

        if (!isReply && !title.trim()) {
            toast.error("Please enter the title.");
            return;
        }
        if (!content.replace(/<[^>]*>/g, '').trim()) {
            toast.error("Please write your comment.");
            return;
        }

        setSaving(true);
        try {
            if (comment) {
                await classDocumentService.updateComment(classId, documentId, comment.id, { title: title.trim(), content });
                toast.success("Comment updated successfully.");
            } else {
                await classDocumentService.createComment(classId, documentId, { title: title.trim(), content });
                toast.success("Comment posted successfully.");
            }
            onSaved();
            onClose();

        } catch (error) {
            toast.error(error.error || "Failed to post the comment.");
            console.error(error);

        } finally {
            setSaving(false);
        }
    };

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4'>
            <div className='bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col'>
                <div className='flex items-center justify-between px-6 py-4 border-b border-slate-200'>
                    <h3 className='text-base font-semibold text-slate-900'>
                        {comment ? (isReply ? 'Edit Reply' : 'Edit Comment') : 'Create Comment'}
                    </h3>
                    <button onClick={onClose} className='w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100'>
                        <X className='w-4 h-4' />
                    </button>
                </div>

                <form onSubmit={handlePost} className='p-6 space-y-4 overflow-y-auto'>
                    {!isReply && (
                        <div className='flex flex-col gap-1.5'>
                            <label className='text-sm font-medium text-slate-700'>Title:</label>
                            <input
                                type='text'
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                maxLength={255}
                                className='w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400'
                            />
                        </div>
                    )}

                    <div className='flex flex-col gap-1.5'>
                        <label className='text-sm font-medium text-slate-700'>Information:</label>
                        <RichTextEditor classId={classId} allowImages={false} value={content} onChange={setContent} />
                    </div>

                    <div className='flex gap-3 pt-2'>
                        <button
                            type='button'
                            onClick={onClose}
                            disabled={saving}
                            className='flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50'
                        >
                            Cancel
                        </button>
                        <button
                            type='submit'
                            disabled={saving}
                            className='flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white py-2 rounded-lg text-sm font-medium transition-colors'
                        >
                            {saving ? 'Posting...' : 'Post'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CommentModal;
