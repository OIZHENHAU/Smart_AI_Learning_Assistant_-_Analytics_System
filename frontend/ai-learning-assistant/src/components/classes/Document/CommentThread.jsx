import React, { useState } from 'react';
import { MessageSquare, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import moment from 'moment';
import RichTextEditor from '../RichTextEditor';
import classDocumentService from '../../../services/ClassDocumentService';

//One comment or reply. Only its author can edit it, its author or lecturer/parents/admin can delete it.
const CommentEntry = ({ item, currentUserId, canModerate, onEdit, onDelete }) => (
    <div className='border border-slate-200 rounded-lg overflow-hidden'>
        <div className='flex items-start justify-between gap-3 bg-slate-100 px-3 py-2'>
            <div className='min-w-0'>
                <p className='text-sm text-purple-600 truncate'>{item.author_name}</p>
                <p className='text-xs text-slate-500'>
                    {moment(item.created_at).format('DD MMM YYYY, h:mma')}{item.updated_at && ' (edited)'}
                </p>
            </div>
            <div className='flex items-center gap-3 shrink-0'>
                {item.author_id === currentUserId && (
                    <button onClick={() => onEdit(item)} className='text-slate-900 hover:text-purple-600' aria-label='Edit comment'>
                        <Pencil className='w-4 h-4' />
                    </button>
                )}
                {(item.author_id === currentUserId || canModerate) && (
                    <button onClick={() => onDelete(item)} className='text-red-500 hover:text-red-600' aria-label='Delete comment'>
                        <Trash2 className='w-4 h-4' />
                    </button>
                )}
            </div>
        </div>
        {/* The backend cleans this HTML before saving, so it is safe to render */}
        <div className='rich-content px-3 py-3 bg-white text-slate-800' dangerouslySetInnerHTML={{ __html: item.content }} />
    </div>
);

const CommentThread = ({ thread, classId, documentId, currentUserId, canModerate, onEdit, onDelete, onChanged }) => {
    const [reply, setReply] = useState('');
    const [editorKey, setEditorKey] = useState(0); //changing the key clears the editor after a reply is posted
    const [posting, setPosting] = useState(false);
    const hasText = reply.replace(/<[^>]*>/g, '').trim().length > 0;

    const handleReply = async () => {
        setPosting(true);
        try {
            await classDocumentService.createComment(classId, documentId, { content: reply, parentId: thread.id });
            setReply('');
            setEditorKey((key) => key + 1);
            onChanged();

        } catch (error) {
            toast.error(error.error || "Failed to post the reply.");
            console.error(error);

        } finally {
            setPosting(false);
        }
    };

    const entryProps = { currentUserId, canModerate, onEdit, onDelete };

    return (
        <div className='bg-white border border-slate-200 rounded-lg p-5 space-y-3'>
            <div>
                <h3 className='flex items-center gap-2 text-xl font-bold text-purple-700'>
                    <MessageSquare className='w-5 h-5 shrink-0' />
                    <span className='break-words min-w-0'>{thread.title}</span>
                </h3>
                <p className='text-sm text-slate-500'>
                    Created by <span className='text-purple-600'>{thread.author_name}</span>
                </p>
            </div>

            <CommentEntry item={thread} {...entryProps} />
            {thread.replies.map((replyItem) => (
                <CommentEntry key={replyItem.id} item={replyItem} {...entryProps} />
            ))}

            <RichTextEditor key={editorKey} classId={classId} allowImages={false} value={reply} onChange={setReply} />
            <button
                onClick={handleReply}
                disabled={!hasText || posting}
                className='px-5 py-2 rounded-full text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white transition-colors disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed'
            >
                {posting ? 'Posting...' : 'Comment'}
            </button>
        </div>
    );
};

export default CommentThread;
