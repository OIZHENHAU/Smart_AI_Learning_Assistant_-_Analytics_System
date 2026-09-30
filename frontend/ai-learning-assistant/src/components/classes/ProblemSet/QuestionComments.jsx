import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, ChevronDown, Send, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import problemSetService from '../../../services/ProblemSetService';
import Spinner from '../../common/Spinner';
import Modal from '../../common/Modal';
import RichTextEditor from '../RichTextEditor';
import { CommentEntry } from '../Document/CommentThread';
import { useAuth } from '../../../context/AuthContext';

const STAFF_ROLES = ['lecturer', 'parents', 'admin'];
const hasText = (html) => (html || '').replace(/<[^>]*>/g, '').trim().length > 0;

//A rich text box with a submit button. onSubmit returns true when it worked; a new message's box then clears.
const Composer = ({ classId, initial = '', submitLabel, busyLabel, onSubmit, onCancel }) => {
    const [value, setValue] = useState(initial);
    const [editorKey, setEditorKey] = useState(0);
    const [busy, setBusy] = useState(false);

    const submit = async () => {
        setBusy(true);
        const ok = await onSubmit(value);
        setBusy(false);
        if (ok && !initial) {
            setValue('');
            setEditorKey((key) => key + 1);
        }
    };

    return (
        <div className='space-y-2'>
            <RichTextEditor key={editorKey} classId={classId} allowImages={false} value={value} onChange={setValue} />
            <div className='flex items-center gap-2'>
                <button
                    onClick={submit}
                    disabled={!hasText(value) || busy}
                    className='flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white transition-colors disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed'
                >
                    {busy ? busyLabel : submitLabel} <Send className='w-3.5 h-3.5' />
                </button>
                {onCancel && (
                    <button onClick={onCancel} disabled={busy} className='px-4 py-2 rounded-full text-sm text-slate-500 hover:bg-slate-100'>
                        Cancel
                    </button>
                )}
            </div>
        </div>
    );
};

//Private question-and-answer between each student and the lecturer, on one problem-set question.
//  Student: sees only their own conversation and writes into it (their first message starts it).
//  Staff:   sees every student's conversation, one card per student, and replies inside each.
//The server decides what each person receives; this component only lays it out.
//collapsible = starts closed (used where many questions are listed at once). It still loads straight away, so the
//header can show how many messages there are, and a student who already has a conversation sees it opened.
const QuestionComments = ({ classId, setId, questionId, collapsible = false }) => {
    const { user } = useAuth();
    const isStaff = STAFF_ROLES.includes(user?.role);

    const [open, setOpen] = useState(!collapsible);
    const autoOpened = useRef(false);
    const [threads, setThreads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [replyingTo, setReplyingTo] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const fetchComments = async () => {
        try {
            const result = await problemSetService.getQuestionComments(classId, setId, questionId);
            const data = Array.isArray(result?.data) ? result.data : [];
            setThreads(data);

            //Only on the first load, so a student who then collapses it isn't forced open again by every reload.
            if (!autoOpened.current) {
                autoOpened.current = true;
                if (!isStaff && data.length > 0) setOpen(true);
            }

        } catch (error) {
            toast.error(error.error || "Failed to load the conversation.");
            console.error(error);

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [classId, setId, questionId]);

    //Runs one change, then reloads. Returns whether it worked, for the composer.
    const run = async (action, failMessage) => {
        try {
            await action();
            await fetchComments();
            return true;

        } catch (error) {
            toast.error(error.error || failMessage);
            console.error(error);
            return false;
        }
    };

    const send = (content, parentId = null) =>
        run(() => problemSetService.createQuestionComment(classId, setId, questionId, { content, parentId }), "Failed to send the message.");

    const save = (comment, content) => run(async () => {
        await problemSetService.updateQuestionComment(classId, setId, questionId, comment.id, { content });
        setEditingId(null);
    }, "Failed to update the message.");

    const handleConfirmDelete = async () => {
        setDeleting(true);
        const ok = await run(() => problemSetService.deleteQuestionComment(classId, setId, questionId, deleteTarget.id), "Failed to delete the message.");
        setDeleting(false);
        if (ok) {
            toast.success("Message deleted.");
            setDeleteTarget(null);
        }
    };

    const renderMessage = (item) => editingId === item.id ? (
        <Composer
            key={item.id}
            classId={classId}
            initial={item.content}
            submitLabel='Save'
            busyLabel='Saving...'
            onSubmit={(content) => save(item, content)}
            onCancel={() => setEditingId(null)}
        />
    ) : (
        <CommentEntry
            key={item.id}
            item={item}
            currentUserId={user?.id}
            canModerate={isStaff}
            onEdit={(comment) => setEditingId(comment.id)}
            onDelete={setDeleteTarget}
        />
    );

    const messages = threads.flatMap((thread) => [thread, ...thread.replies]);
    const summary = isStaff
        ? `${threads.length} conversation${threads.length === 1 ? '' : 's'}`
        : `${messages.length} message${messages.length === 1 ? '' : 's'}`;
    const heading = isStaff ? 'Student Questions' : 'Comment';

    return (
        <div className='bg-white border border-slate-200 rounded-2xl p-5'>
            {collapsible ? (
                <button onClick={() => setOpen((prev) => !prev)} className='w-full flex items-center justify-between text-left' aria-expanded={open}>
                    <span className='flex items-center gap-2 text-base font-semibold text-slate-900'>
                        <MessageSquare className='w-4 h-4 text-purple-600' />
                        {heading}{!loading && threads.length > 0 ? ` (${summary})` : ''}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
            ) : (
                <h4 className='flex items-center gap-2 text-base font-semibold text-slate-900'>
                    <MessageSquare className='w-4 h-4 text-purple-600' /> {heading}
                </h4>
            )}

            {open && (
                <div className='mt-2 space-y-4'>
                    {loading ? (
                        <div className='flex justify-center py-6'><Spinner /></div>
                    ) : isStaff ? (
                        threads.length === 0 ? (
                            <p className='text-center text-sm text-slate-400 py-4'></p>
                        ) : (
                            threads.map((thread) => (
                                <div key={thread.id} className='border border-slate-200 rounded-xl p-4 space-y-2'>
                                    <p className='text-sm font-semibold text-slate-700'>
                                        Conversation with <span className='text-purple-600'>{thread.student_name || thread.author_name}</span>
                                    </p>
                                    {[thread, ...thread.replies].map((item) => renderMessage(item))}
                                    {replyingTo === thread.id ? (
                                        <Composer
                                            classId={classId}
                                            submitLabel='Reply'
                                            busyLabel='Sending...'
                                            onSubmit={async (content) => {
                                                const ok = await send(content, thread.id);
                                                if (ok) setReplyingTo(null);
                                                return ok;
                                            }}
                                            onCancel={() => setReplyingTo(null)}
                                        />
                                    ) : (
                                        <button onClick={() => setReplyingTo(thread.id)} className='text-xs font-semibold text-purple-600 hover:text-purple-700'>
                                            Reply to {thread.student_name || thread.author_name}
                                        </button>
                                    )}
                                </div>
                            ))
                        )
                    ) : (
                        <>
                            {messages.length === 0 ? (
                                <p className='text-sm text-slate-400'></p>
                            ) : (
                                <div className='space-y-2'>{messages.map((item) => renderMessage(item))}</div>
                            )}
                            <Composer
                                classId={classId}
                                submitLabel={messages.length ? 'Send' : 'Comment'}
                                busyLabel='Sending...'
                                onSubmit={(content) => send(content)}
                            />
                        </>
                    )}
                </div>
            )}

            <Modal isOpen={!!deleteTarget} onClose={() => !deleting && setDeleteTarget(null)} title='Delete Message'>
                <p className='text-sm text-slate-500 mb-6'>
                    {deleteTarget && !deleteTarget.parent_id
                        ? 'This is the first message of the conversation, so the whole conversation, including every reply, will be deleted.'
                        : 'Are you sure you want to delete this message?'} This action cannot be undone.
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
            </Modal>
        </div>
    );
};

export default QuestionComments;
