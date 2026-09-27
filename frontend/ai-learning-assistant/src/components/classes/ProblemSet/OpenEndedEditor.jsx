import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import problemSetService from '../../../services/ProblemSetService';
import RichTextEditor from '../RichTextEditor';
import { BASE_URL } from '../../../utils/apiPath';
import { formatFileSize } from '../../../utils/formatFileSize';

//Same limits as backend/config/problemSetFileUpload.js.
const ALLOWED_EXTENSIONS = ['.pdf', '.ipynb', '.zip'];
const MAX_SIZE = 50 * 1024 * 1024;

//Files upload as soon as they're dropped in (like description images); the description waits for Save as Draft.
const OpenEndedEditor = ({ classId, setId, questionId, description, files, onDescriptionChange, onFilesChange }) => {
    const inputRef = useRef(null);
    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [removingId, setRemovingId] = useState(null);

    const upload = async (fileList) => {
        const valid = [...fileList].filter((file) => {
            const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
            if (!ALLOWED_EXTENSIONS.includes(extension)) {
                toast.error(`${file.name}: only PDF, Jupyter Notebook or ZIP files are allowed.`);
                return false;
            }
            if (file.size > MAX_SIZE) {
                toast.error(`${file.name} is larger than 50MB.`);
                return false;
            }
            return true;
        });
        if (valid.length === 0) return;

        setUploading(true);
        const added = [];
        try {
            for (const file of valid) {
                const result = await problemSetService.uploadQuestionFile(classId, setId, questionId, file);
                added.push(result.data);
            }

        } catch (error) {
            toast.error(error.error || "Failed to attach the file.");
            console.error(error);

        } finally {
            if (added.length) onFilesChange([...files, ...added]);
            setUploading(false);
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    const handleRemove = async (file) => {
        setRemovingId(file.id);
        try {
            await problemSetService.deleteQuestionFile(classId, setId, questionId, file.id);
            onFilesChange(files.filter((f) => f.id !== file.id));

        } catch (error) {
            toast.error(error.error || "Failed to remove the file.");
            console.error(error);

        } finally {
            setRemovingId(null);
        }
    };

    const openPicker = () => {
        if (!uploading) inputRef.current?.click();
    };

    return (
        <div className='space-y-5'>
            <div>
                <label className='text-sm font-medium text-slate-700 mb-1.5 block'>Description (optional)</label>
                <RichTextEditor
                    classId={classId}
                    value={description}
                    onChange={onDescriptionChange}
                    uploadImage={(file) => problemSetService.uploadQuestionImage(classId, setId, file)}
                />
            </div>

            <div
                role='button'
                tabIndex={0}
                onClick={openPicker}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openPicker(); }}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); if (!uploading) upload(e.dataTransfer.files); }}
                className={`flex flex-col items-center justify-center text-center gap-2 py-10 px-4 rounded-2xl border-2 border-dashed cursor-pointer transition-colors ${
                    dragging ? 'border-purple-400 bg-purple-50' : 'border-slate-200 bg-slate-50/60 hover:border-purple-300'}`}
            >
                {uploading
                    ? <Loader2 className='w-8 h-8 text-purple-500 animate-spin' />
                    : <UploadCloud className='w-8 h-8 text-slate-400' />}
                <p className='text-base font-semibold text-slate-800'>
                    {uploading ? 'Uploading...' : 'Attach supplementary files or dataset (optional)'}
                </p>
                <p className='text-sm text-slate-400'>Drag and drop PDFs, Jupyter Notebooks, or ZIP files (Max 50MB)</p>
                <input ref={inputRef} type='file' multiple accept={ALLOWED_EXTENSIONS.join(',')} className='hidden' onChange={(e) => upload(e.target.files)} />
            </div>

            {files.length > 0 && (
                <ul className='space-y-2'>
                    {files.map((file) => (
                        <li key={file.id} className='flex items-center gap-3 border border-slate-200 rounded-xl px-4 py-2.5'>
                            <FileText className='w-5 h-5 text-purple-500 shrink-0' />
                            <a
                                href={`${BASE_URL}/uploads/problem-set-files/${file.file_name}`}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='flex-1 min-w-0 text-sm text-slate-700 truncate hover:text-purple-600'
                            >
                                {file.original_name}
                            </a>
                            <span className='text-xs text-slate-400 shrink-0'>{formatFileSize(file.file_size)}</span>
                            <button
                                type='button'
                                onClick={() => handleRemove(file)}
                                disabled={removingId === file.id}
                                aria-label={`Remove ${file.original_name}`}
                                className='p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50'
                            >
                                <Trash2 className='w-4 h-4' />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default OpenEndedEditor;
