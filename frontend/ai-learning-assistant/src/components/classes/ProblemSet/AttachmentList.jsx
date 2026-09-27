import React from 'react';
import { FileText, Download } from 'lucide-react';
import { BASE_URL } from '../../../utils/apiPath';
import { formatFileSize } from '../../../utils/formatFileSize';

//Read-only list of uploaded files; each row opens/downloads the file. folder is its sub-folder under /uploads.
const AttachmentList = ({ files, folder, className = '' }) => {
    if (!files?.length) return null;

    return (
        <ul className={`space-y-2 ${className}`}>
            {files.map((file) => (
                <li key={file.id}>
                    <a
                        href={`${BASE_URL}/uploads/${folder}/${file.file_name}`}
                        target='_blank'
                        rel='noopener noreferrer'
                        download={file.original_name}
                        className='flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 hover:border-purple-300 transition-colors'
                    >
                        <FileText className='w-5 h-5 text-purple-500 shrink-0' />
                        <span className='flex-1 min-w-0 truncate text-sm text-slate-700'>{file.original_name}</span>
                        <span className='text-xs text-slate-400 shrink-0'>{formatFileSize(file.file_size)}</span>
                        <Download className='w-5 h-5 text-slate-600 shrink-0' />
                    </a>
                </li>
            ))}
        </ul>
    );
};

export default AttachmentList;
