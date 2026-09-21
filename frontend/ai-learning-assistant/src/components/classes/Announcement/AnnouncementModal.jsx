import React, { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import RichTextEditor from '../RichTextEditor';
import announcementService from '../../../services/AnnouncementService';

//announcement = null creates a new one, otherwise the given announcement is edited.
//Render it only while it is open, so the editor always starts from the saved content.
const AnnouncementModal = ({ classId, announcement, onClose, onSaved }) => {
    const [title, setTitle] = useState(announcement?.title || '');
    const [content, setContent] = useState(announcement?.content || '');
    const [saving, setSaving] = useState(false);

    const handlePublish = async (e) => {
        e.preventDefault();

        if (!title.trim()) {
            toast.error("Please enter the title.");
            return;
        }

        setSaving(true);
        try {
            if (announcement) {
                await announcementService.updateAnnouncement(classId, announcement.id, title.trim(), content);
                toast.success("Announcement updated successfully.");
            } else {
                await announcementService.createAnnouncement(classId, title.trim(), content);
                toast.success("Announcement published successfully.");
            }
            onSaved();
            onClose();

        } catch (error) {
            toast.error(error.error || "Failed to publish the announcement.");
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
                        {announcement ? 'Edit Announcement' : 'Create Announcement'}
                    </h3>
                    <button onClick={onClose} className='w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100'>
                        <X className='w-4 h-4' />
                    </button>
                </div>

                <form onSubmit={handlePublish} className='p-6 space-y-4 overflow-y-auto'>
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

                    <div className='flex flex-col gap-1.5'>
                        <label className='text-sm font-medium text-slate-700'>Information:</label>
                        <RichTextEditor classId={classId} value={content} onChange={setContent} />
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
                            {saving ? 'Publishing...' : 'Publish'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AnnouncementModal;
