import React, { useState, useEffect } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import classDocumentService from '../../services/ClassDocumentService';
import Spinner from '../../components/common/Spinner';
import PageHeader from '../../components/common/PageHeader';
import Tabs from '../../components/common/Tab';
import DocumentComments from '../../components/classes/Document/DocumentComments';

const ClassDocumentDetailPage = () => {
    const { classData } = useOutletContext();
    const { documentId } = useParams();
    const [document, setDocument] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Content');

    useEffect(() => {
        const fetchDocument = async () => {
            try {
                const result = await classDocumentService.getDocument(classData.id, documentId);
                setDocument(result.data);

            } catch (error) {
                toast.error(error.error || "Failed to open the document.");
                console.error(error);

            } finally {
                setLoading(false);
            }
        };

        fetchDocument();
    }, [classData.id, documentId]);

    if (loading) {
        return <Spinner />;
    }

    if (!document) {
        return (
            <div className='text-center p-8'>
                <p className='text-slate-600 mb-3'>The document was not found.</p>
                <Link to={`/classes/${classData.id}/documents`} className='text-sm text-purple-600 hover:text-purple-700'>Back to documents</Link>
            </div>
        );
    }

    //Browsers can preview a PDF inline, DOCX and PPTX can only be downloaded.
    const isPdf = document.file_name.toLowerCase().endsWith('.pdf');

    const content = (
        <div className='bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm'>
            <div className='flex items-center justify-between p-4 bg-gray-50 border-b border-gray-300'>
                <span className='text-sm font-medium text-gray-700'>Document Viewer</span>
                <a
                    href={document.file_path}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='inline-flex items-center gap-1.5 text-sm text-purple-500 hover:text-purple-600 font-medium transition-colors'
                >
                    <ExternalLink size={15} />
                    {isPdf ? 'Open in new tab' : 'Download'}
                </a>
            </div>
            {isPdf ? (
                <div className='bg-gray-100 p-1'>
                    <iframe
                        src={document.file_path}
                        className='w-full bg-white rounded border border-gray-300'
                        title='File Viewer'
                        frameBorder='0'
                        style={{ colorScheme: 'light', height: 'calc(100vh - 220px)', minHeight: '600px' }}
                    />
                </div>
            ) : (
                <p className='p-10 text-center text-sm text-slate-500'>
                    This file type cannot be previewed in the browser. Use Download to open it.
                </p>
            )}
        </div>
    );

    const tabs = [
        { name: 'Content', label: 'Content', content },
        { name: 'Comment', label: 'Comment', content: <DocumentComments classId={classData.id} documentId={document.id} /> }
    ];

    return (
        <div>
            <div className='mb-4'>
                <Link to={`/classes/${classData.id}/documents`} className='inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors'>
                    <ArrowLeft size={14} />
                    Back
                </Link>
            </div>
            <PageHeader title={document.title} />
            <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
    );
};

export default ClassDocumentDetailPage;
