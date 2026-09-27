import React, { useRef } from 'react';
import { UploadCloud, Paperclip, X } from 'lucide-react';
import toast from 'react-hot-toast';
import RichTextEditor from '../RichTextEditor';
import { formatFileSize } from '../../../utils/formatFileSize';

//Same limits as backend/config/problemSetAnswerUpload.js.
const ALLOWED_EXTENSIONS = ['.pdf', '.ipynb', '.zip', '.docx', '.txt', '.png', '.jpg', '.jpeg'];
const MAX_SIZE = 50 * 1024 * 1024;
const MAX_FILES = 5;

//The "Your Answer" box. Files stay in the browser until the whole attempt is submitted.
const AttemptOpenEnded = ({ classId, text, files, onTextChange, onFilesChange }) => {
    const inputRef = useRef(null);

    const addFiles = (list) => {
        const next = [...files];
        for (const file of list) {
            const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
            if (!ALLOWED_EXTENSIONS.includes(extension)) {
                toast.error(`${file.name}: this file type isn't allowed.`);
                continue;
            }
            if (file.size > MAX_SIZE) {
                toast.error(`${file.name} is larger than 50MB.`);
                continue;
            }
            if (next.length >= MAX_FILES) {
                toast.error(`You can attach up to ${MAX_FILES} files.`);
                break;
            }
            next.push(file);
        }
        onFilesChange(next);
    };

    return (
        <div>
            <h4 className='text-base font-bold text-slate-900 mb-3'>Your Answer:</h4>
            <RichTextEditor
                classId={classId}
                value={text}
                onChange={onTextChange}
                allowImages={false}
                toolbarExtra={
                    <>
                        <button
                            type='button'
                            onClick={() => inputRef.current?.click()}
                            title='Attach files'
                            aria-label='Attach files'
                            className='w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition-colors'
                        >
                            <UploadCloud className='w-4 h-4' />
                        </button>
                        <input
                            ref={inputRef}
                            type='file'
                            multiple
                            accept={ALLOWED_EXTENSIONS.join(',')}
                            className='hidden'
                            onChange={(e) => {
                                addFiles([...e.target.files]);
                                e.target.value = '';
                            }}
                        />
                    </>
                }
            />

            {files.length > 0 && (
                <ul className='mt-3 space-y-2'>
                    {files.map((file, index) => (
                        <li key={`${file.name}-${index}`} className='flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2.5'>
                            <Paperclip className='w-4 h-4 text-purple-500 shrink-0' />
                            <span className='flex-1 min-w-0 truncate text-sm text-slate-700'>{file.name}</span>
                            <span className='text-xs text-slate-400 shrink-0'>{formatFileSize(file.size)}</span>
                            <button
                                type='button'
                                onClick={() => onFilesChange(files.filter((_, i) => i !== index))}
                                aria-label={`Remove ${file.name}`}
                                className='text-slate-300 hover:text-red-500'
                            >
                                <X className='w-4 h-4' />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            <p className='text-xs text-slate-400 mt-2'>
                Use the upload icon to attach up to {MAX_FILES} files (PDF, Jupyter Notebook, ZIP, Word, text or images, max 50MB each). They're uploaded when you submit.
            </p>
        </div>
    );
};

export default AttemptOpenEnded;
