import React, { useState, useEffect } from "react";
import { Plus, Upload, Trash2, FileText, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import documentService from "../../services/DocumentService";
import Spinner from "../../components/common/Spinner";


const DocumentListPage = () => {
    const navigate = useNavigate();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadTitle, setUploadTitle] = useState("");
    const [uploading, setUploading] = useState(false);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState(null);

    const fetchDocuments = async () => {
        try {
            const data = await documentService.getAllDocuments();
            setDocuments(data);

        } catch (error) {
            toast.error("Failed to fetch the documents at the page.");
            console.error(error);

        } finally {
            setLoading(false);

        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    const handleFileChange = (x) => {
        const file = x.target.files[0];

        if (file) {
            setUploadFile(file);
            setUploadTitle(file.name.replace(/\.[^/.]+$/, ""));
        }
    };

    const handleUpload = async (x) => {
        x.preventDefault();

        if (!uploadFile || !uploadTitle) {
            toast.error("Please provide the file and the title of the file.");
            return;
        }
        setUploading(true);
        const formData = new FormData();
        formData.append("file", uploadFile);
        formData.append("title", uploadTitle);

        try {
            await documentService.uploadDocument(formData);
            toast.success("Document upload successfully!");
            setIsUploadModalOpen(false);
            setUploadFile(null);
            setUploadTitle("");
            setLoading(true);
            fetchDocuments();

        } catch (error) {
            toast.error(error.message || "Uplaod document failed at the document page.");

        } finally {
            setUploading(false);
        }
    };

    const handleDeleteRequest = async (document) => {
        setSelectedDocument(document);
        setIsDeleteModalOpen(true);

    };

    const handleConfirmDelete = async () => {
        if (!selectedDocument) {
            return;
        }

        setDeleting(true);

        try {
            await documentService.deleteDocument(selectedDocument.id);
            toast.success(`"${selectedDocument.title}" have deleted successfully`);
            setIsDeleteModalOpen(false);
            setSelectedDocument(null);
            setDocuments(documents.filter((doc) => doc.id !== selectedDocument.id));

        } catch (error) {
            toast.error(error.message || "Failed to delete the document at the document page.");

        } finally {
            setDeleting(false);
        }
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex justify-center items-center py-20">
                    <Spinner />
                </div>
            );
        }

        if (documents.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
                        <FileText className="w-8 h-8 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-700 mb-1">No documents yet</h3>
                    <p className="text-slate-400 text-sm mb-6">Please upload your first document ^.^</p>
                    <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Upload Document
                    </button>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc) => (
                    <div
                        key={doc.id}
                        onClick={() => navigate(`/documents/${doc.id}`)}
                        className="bg-white border border-slate-200 rounded-xl p-5 cursor-pointer hover:shadow-md hover:border-purple-300 transition-all group"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
                                    <FileText className="w-5 h-5 text-purple-500" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-slate-800 truncate">{doc.title}</p>
                                    <p className="text-xs text-slate-400 truncate">{doc.file_name}</p>
                                </div>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteRequest(doc); }}
                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all shrink-0"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-xs text-slate-400 mt-3">
                            {doc.upload_date ? new Date(doc.upload_date).toLocaleDateString() : ''}
                        </p>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="min-h-screen p-6">
            <div className="relative max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-medium text-slate-900 tracking-tight mb-1">
                            My Documents
                        </h1>
                        <p className="text-slate-400 text-sm">
                            Manage your learning documents.
                        </p>
                    </div>
                    {documents.length > 0 && (
                        <button
                            onClick={() => setIsUploadModalOpen(true)}
                            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Upload Document
                        </button>
                    )}
                </div>

                {renderContent()}
            </div>

            {/* Upload Modal */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-semibold text-slate-800">Upload Document</h2>
                            <button onClick={() => setIsUploadModalOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleUpload} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={uploadTitle}
                                    onChange={(e) => setUploadTitle(e.target.value)}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="Document title"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">File</label>
                                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-lg p-6 cursor-pointer hover:border-purple-400 transition-colors">
                                    <Upload className="w-6 h-6 text-slate-400 mb-2" />
                                    <span className="text-sm text-slate-500">
                                        {uploadFile ? uploadFile.name : 'Click to choose a file'}
                                    </span>
                                    <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.doc,.docx,.txt" />
                                </label>
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setIsUploadModalOpen(false)}
                                    className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                                >
                                    {uploading ? 'Uploading...' : 'Upload'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                                <Trash2 className="w-5 h-5 text-red-500" />
                            </div>
                            <h2 className="text-lg font-semibold text-slate-800">Delete Document</h2>
                        </div>
                        <p className="text-sm text-slate-500 mb-6">
                            Are you sure you want to delete <span className="font-medium text-slate-700">"{selectedDocument?.title}"</span>? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={deleting}
                                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DocumentListPage