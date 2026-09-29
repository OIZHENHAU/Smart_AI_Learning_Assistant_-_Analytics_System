import React, { useRef } from 'react';
import { UploadCloud, Paperclip, X, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import RichTextEditor from '../RichTextEditor';
import { formatFileSize } from '../../../utils/formatFileSize';
import { BASE_URL } from '../../../utils/apiPath';

const ALLOWED_EXTENSIONS = ['.pdf', '.ipynb', '.zip', '.docx', '.txt', '.png', '.jpg', '.jpeg'];
const MAX_SIZE = 50 * 1024 * 1024;
const MAX_FILES = 5;

const FileRow = ({ icon: Icon, name, size, href, note, onRemove }) => (
    <li className='flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2.5'>
        <Icon className='w-4 h-4 text-purple-500 shrink-0' />
        {href ? (
            <a href={href} target='_blank' rel='noopener noreferrer' className='flex-1 min-w-0 truncate text-sm text-slate-700 hover:text-purple-600'>{name}</a>
        ) : (
            <span className='flex-1 min-w-0 truncate text-sm text-slate-700'>{name}</span>
        )}
        {note && <span className='text-xs text-green-600 shrink-0'>{note}</span>}
        <span className='text-xs text-slate-400 shrink-0'>{formatFileSize(size)}</span>
        <button type='button' onClick={onRemove} aria-label={`Remove ${name}`} className='text-slate-300 hover:text-red-500'>
            <X className='w-4 h-4' />
        </button>
    </li>
);

//savedFiles are already stored with the saved attempt; files are new ones that go up on the next Save Attempt or
//Submit. Removing a saved file only takes effect on that next save/submit.
const AttemptOpenEnded = ({ classId, text, files, savedFiles = [], onTextChange, onFilesChange, onSavedFilesChange }) => {
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
            if (savedFiles.length + next.length >= MAX_FILES) {
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

            {(savedFiles.length > 0 || files.length > 0) && (
                <ul className='mt-3 space-y-2'>
                    {savedFiles.map((file) => (
                        <FileRow
                            key={`saved-${file.id}`}
                            icon={CheckCircle2}
                            name={file.original_name}
                            size={file.file_size}
                            href={`${BASE_URL}/uploads/problem-set-answers/${file.file_name}`}
                            note='Saved'
                            onRemove={() => onSavedFilesChange(savedFiles.filter((f) => f.id !== file.id))}
                        />
                    ))}
                    {files.map((file, index) => (
                        <FileRow
                            key={`new-${file.name}-${index}`}
                            icon={Paperclip}
                            name={file.name}
                            size={file.size}
                            onRemove={() => onFilesChange(files.filter((_, i) => i !== index))}
                        />
                    ))}
                </ul>
            )}
            <p className='text-xs text-slate-400 mt-2'>
                Use the upload icon to attach up to {MAX_FILES} files (PDF, Jupyter Notebook, ZIP, Word, text or images, max 50MB each).
            </p>
        </div>
    );
};

export default AttemptOpenEnded;
