import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Plus, Upload, Trash2, FileText, X, Notebook } from 'lucide-react';
import toast from 'react-hot-toast';
import moment from 'moment';
import classDocumentService from '../../services/ClassDocumentService';
import Spinner from '../../components/common/Spinner';
import { useAuth } from '../../context/AuthContext';

const STAFF_ROLES = ['lecturer', 'parents', 'admin'];

const ClassDocumentsPage = () => {
    const { classData } = useOutletContext();
    const { user } = useAuth();
    const navigate = useNavigate();
    //Everyone in the class can view the documents, only lecturer, parents and admin can upload or delete.
    const canManage = STAFF_ROLES.includes(user?.role);

    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadTitle, setUploadTitle] = useState('');
    const [uploading, setUploading] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    //Search filters, all empty by default so every document is shown.
    const [search, setSearch] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const hasFilters = search || startDate || endDate;

    const fetchDocuments = async () => {
        try {
            const result = await classDocumentService.getDocuments(classData.id, { search, startDate, endDate });
            setDocuments(Array.isArray(result?.data) ? result.data : []);

        } catch (error) {
            toast.error(error.error || "Failed to fetch the documents.");
            console.error(error);

        } finally {
            setLoading(false);
        }
    };

    //Runs on mount, then (debounced) whenever a search filter changes.
    useEffect(() => {
        const timeout = setTimeout(fetchDocuments, 400);
        return () => clearTimeout(timeout);
    }, [classData.id, search, startDate, endDate]);

    const closeUploadModal = () => {
        setIsUploadModalOpen(false);
        setUploadFile(null);
        setUploadTitle('');
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];

        if (file) {
            setUploadFile(file);
            setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();

        if (!uploadFile || !uploadTitle.trim()) {
            toast.error("Please provide the file and the title of the file.");
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', uploadFile);
        formData.append('title', uploadTitle.trim());

        try {
            await classDocumentService.uploadDocument(classData.id, formData);
            toast.success("Document uploaded successfully!");
            closeUploadModal();
            setLoading(true);
            fetchDocuments();

        } catch (error) {
            toast.error(error.error || error.message || "Failed to upload the document.");
            console.error(error);

        } finally {
            setUploading(false);
        }
    };

    const handleConfirmDelete = async () => {
        setDeleting(true);
        try {
            await classDocumentService.deleteDocument(classData.id, deleteTarget.id);
            toast.success(`"${deleteTarget.title}" deleted successfully.`);
            setDocuments((prev) => prev.filter((doc) => doc.id !== deleteTarget.id));
            setDeleteTarget(null);

        } catch (error) {
            toast.error(error.error || "Failed to delete the document.");
            console.error(error);

        } finally {
            setDeleting(false);
        }
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className='flex justify-center items-center py-20'>
                    <Spinner />
                </div>
            );
        }

        if (documents.length === 0) {
            return (
                <div className='flex flex-col items-center justify-center py-24 text-center'>
                    <div className='w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4'>
                        <FileText className='w-8 h-8 text-purple-400' />
                    </div>
                    <h3 className='text-lg font-medium text-slate-700 mb-1'>
                        {hasFilters ? 'No matching document' : 'No documents yet'}
                    </h3>
                    <p className='text-slate-400 text-sm mb-6'>
                        {hasFilters
                            ? 'Try changing your search.'
                            : canManage ? 'Please upload the first document for this class.' : 'Your lecturer has not uploaded any document yet.'}
                    </p>
                    {canManage && !hasFilters && (
                        <button
                            onClick={() => setIsUploadModalOpen(true)}
                            className='flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
                        >
                            <Plus className='w-4 h-4' />
                            Upload Document
                        </button>
                    )}
                </div>
            );
        }

        return (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                {documents.map((doc) => (
                    <div
                        key={doc.id}
                        onClick={() => navigate(`/classes/${classData.id}/documents/${doc.id}`)}
                        className='bg-white border border-slate-200 rounded-xl p-5 cursor-pointer hover:shadow-md hover:border-purple-300 transition-all group'
                    >
                        <div className='flex items-start justify-between gap-3'>
                            <div className='flex items-center gap-4 min-w-0'>
                                <div className='w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0'>
                                    <FileText className='w-5 h-5 text-purple-500' />
                                </div>
                                <div className='min-w-0'>
                                    <p className='text-sm font-bold text-slate-800 truncate'>{doc.title}</p>
                                    <p className='text-xs text-slate-400 truncate'>{doc.original_name}</p>
                                </div>
                            </div>
                            {canManage && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(doc); }}
                                    className='opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all shrink-0'
                                    aria-label='Delete document'
                                >
                                    <Trash2 className='w-4 h-4' />
                                </button>
                            )}
                        </div>
                        <div className='flex items-center justify-between mt-3 gap-2'>
                            <p className='text-xs text-slate-400'>
                                Created on {moment(doc.created_at).format('MMM D, YYYY')}
                            </p>
                            <span className='text-xs font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100 truncate'>
                                {doc.uploader_name}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div>
            <div className='flex items-center justify-between mb-8'>
                <div className='flex items-center gap-4'>
                    <div className='w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0'>
                        <Notebook className='w-7 h-7 text-purple-600' strokeWidth={2} />
                    </div>
                    <div>
                        <h2 className='text-2xl font-bold text-slate-900'>Documents</h2>
                        <p className='text-sm text-slate-500'>Documents shared in this class.</p>
                    </div>
                </div>
                {canManage && (documents.length > 0 || hasFilters) && (
                    <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className='flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
                    >
                        <Plus className='w-4 h-4' />
                        Upload Document
                    </button>
                )}
            </div>

            {/* Search bar */}
            <div className='flex flex-wrap items-end gap-4 w-full mb-8'>
                <div className='flex-1 min-w-[220px] flex flex-col gap-1.5'>
                    <label className='text-sm font-medium text-slate-700'>Title or File Name:</label>
                    <input
                        type='text'
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className='w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400'
                    />
                </div>
                <div className='flex-[1.4] min-w-[280px] flex flex-col gap-1.5'>
                    <label className='text-sm font-medium text-slate-700'>Created At:</label>
                    <div className='flex items-center gap-2'>
                        <input
                            type='date'
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className='flex-1 h-10 px-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400'
                        />
                        <span className='text-sm text-slate-500 shrink-0'>to</span>
                        <input
                            type='date'
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className='flex-1 h-10 px-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400'
                        />
                    </div>
                </div>
            </div>

            {renderContent()}

            {/* Upload Modal */}
            {isUploadModalOpen && (
                <div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50'>
                    <div className='bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6'>
                        <div className='flex items-center justify-between mb-5'>
                            <h2 className='text-lg font-semibold text-slate-800'>Upload Document</h2>
                            <button onClick={closeUploadModal} className='p-1.5 rounded-lg hover:bg-slate-100 text-slate-400'>
                                <X className='w-5 h-5' />
                            </button>
                        </div>
                        <form onSubmit={handleUpload} className='space-y-4'>
                            <div>
                                <label className='block text-sm font-medium text-slate-700 mb-1'>Title</label>
                                <input
                                    type='text'
                                    value={uploadTitle}
                                    onChange={(e) => setUploadTitle(e.target.value)}
                                    maxLength={255}
                                    className='w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500'
                                    placeholder='Document title'
                                />
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-slate-700 mb-1'>File</label>
                                <label className='flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-lg p-6 cursor-pointer hover:border-purple-400 transition-colors'>
                                    <Upload className='w-6 h-6 text-slate-400 mb-2' />
                                    <span className='text-sm text-slate-500 text-center break-all'>
                                        {uploadFile ? uploadFile.name : 'Click to choose a file (PDF, DOCX or PPTX)'}
                                    </span>
                                    <input type='file' className='hidden' onChange={handleFileChange} accept='.pdf,.docx,.pptx' />
                                </label>
                            </div>
                            <div className='flex gap-3 pt-1'>
                                <button
                                    type='button'
                                    onClick={closeUploadModal}
                                    disabled={uploading}
                                    className='flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    disabled={uploading}
                                    className='flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white py-2 rounded-lg text-sm font-medium transition-colors'
                                >
                                    {uploading ? 'Uploading...' : 'Upload'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50'>
                    <div className='bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6'>
                        <div className='flex items-center gap-3 mb-4'>
                            <div className='w-10 h-10 bg-red-50 rounded-full flex items-center justify-center'>
                                <Trash2 className='w-5 h-5 text-red-500' />
                            </div>
                            <h2 className='text-lg font-semibold text-slate-800'>Delete Document</h2>
                        </div>
                        <p className='text-sm text-slate-500 mb-6'>
                            Are you sure you want to delete <span className='font-medium text-slate-700'>"{deleteTarget.title}"</span>?
                            Its comments will be deleted too. This action cannot be undone.
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

export default ClassDocumentsPage;
