import React, { useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { TextStyle, FontFamily } from '@tiptap/extension-text-style';
import { Bold, Italic, Underline, List, ListOrdered, ImagePlus } from 'lucide-react';
import toast from 'react-hot-toast';
import announcementService from '../../services/AnnouncementService';

const FONTS = [
    { label: 'Default', value: '' },
    { label: 'Arial', value: 'Arial, sans-serif' },
    { label: 'Verdana', value: 'Verdana, sans-serif' },
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'Times New Roman', value: '"Times New Roman", serif' },
    { label: 'Courier New', value: '"Courier New", monospace' }
];

const ToolbarButton = ({ onClick, active, label, children }) => (
    <button
        type='button'
        onClick={onClick}
        aria-label={label}
        title={label}
        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors
            ${active ? 'bg-purple-100 text-purple-700' : 'text-slate-600 hover:bg-slate-100'}`}
    >
        {children}
    </button>
);

//allowImages = false hides the image button (comments can't have images, and students can't upload them).
const RichTextEditor = ({ classId, value, onChange, allowImages = true }) => {
    const fileInputRef = useRef(null);

    const editor = useEditor({
        extensions: [StarterKit, Image, TextStyle, FontFamily],
        content: value,
        shouldRerenderOnTransaction: true, //keeps the toolbar highlights in sync
        onUpdate: ({ editor }) => onChange(editor.getHTML()),
        editorProps: { attributes: { class: 'rich-content min-h-[200px] px-4 py-3 focus:outline-none' } }
    });

    if (!editor) return null;

    const handleFont = (e) => {
        const font = e.target.value;
        if (font) editor.chain().focus().setFontFamily(font).run();
        else editor.chain().focus().unsetFontFamily().run();
    };

    const handleImage = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;

        try {
            const result = await announcementService.uploadImage(classId, file);
            editor.chain().focus().setImage({ src: result.data.url }).run();

        } catch (error) {
            toast.error(error.error || error.message || "Failed to upload the image.");
        }
    };

    return (
        <div className='border border-slate-300 rounded-lg focus-within:ring-2 focus-within:ring-purple-200 focus-within:border-purple-400'>
            <div className='flex flex-wrap items-center gap-1 px-2 py-1.5 border-b border-slate-200'>
                <select
                    value={editor.getAttributes('textStyle').fontFamily || ''}
                    onChange={handleFont}
                    className='h-8 px-2 mr-1 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none'
                >
                    {FONTS.map((font) => <option key={font.label} value={font.value}>{font.label}</option>)}
                </select>

                <ToolbarButton label='Bold' active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
                    <Bold className='w-4 h-4' />
                </ToolbarButton>
                <ToolbarButton label='Italic' active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
                    <Italic className='w-4 h-4' />
                </ToolbarButton>
                <ToolbarButton label='Underline' active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
                    <Underline className='w-4 h-4' />
                </ToolbarButton>
                <ToolbarButton label='Bullet list' active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
                    <List className='w-4 h-4' />
                </ToolbarButton>
                <ToolbarButton label='Numbered list' active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
                    <ListOrdered className='w-4 h-4' />
                </ToolbarButton>
                {allowImages && (
                    <>
                        <ToolbarButton label='Attach image' onClick={() => fileInputRef.current?.click()}>
                            <ImagePlus className='w-4 h-4' />
                        </ToolbarButton>
                        <input ref={fileInputRef} type='file' accept='image/*' className='hidden' onChange={handleImage} />
                    </>
                )}
            </div>

            <EditorContent editor={editor} />
        </div>
    );
};

export default RichTextEditor;
