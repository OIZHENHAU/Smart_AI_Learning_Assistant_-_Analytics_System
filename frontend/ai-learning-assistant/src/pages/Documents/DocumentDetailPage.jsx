import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import documentService from "../../services/DocumentService";
import Spinner from '../../components/common/Spinner';
import toast from 'react-hot-toast';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import PageHeader from "../../components/common/PageHeader";
import Tabs from '../../components/common/Tab';
import AIChatInterface from "../../components/ai-chat/AIChatInterface";
import AISummary from "../../components/ai-summary/AISummary";
import QuizManager from "../../components/quizzes/QuizManager";


const DocumentDetailPage = () => {
    const { id } = useParams();
    const [document, setCurrentDocument] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Content');

    useEffect(() => {
        const fetchParticularDocumentDetails = async () => {
            try {
                const data = await documentService.getDocumentById(id);
                setCurrentDocument(data);

            } catch (error) {
                toast.error("Fail to gett he particular document at the document detail page.");
                console.error(error);

            } finally {
                setLoading(false);
            }
        };

        fetchParticularDocumentDetails();
    }, [id]);

    const getFileURL = () => {
        if (!document?.data?.file_path) {
            return null;
        }

        const currentFilePath = document.data.file_path;

        if (currentFilePath.startsWith("https://") || currentFilePath.startsWith("http://")) {
            return currentFilePath;
        }

        const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5528';
        return `${baseURL}${currentFilePath.startsWith('/') ? "" : '/'}${currentFilePath}`;
    }

    const renderContent = () => {
        if (loading) {
            return <Spinner />;
        }

        if (!document || !document.data || !document.data.file_path) {
            return <div className="">File are not available.</div>
        }

        const currentFileURL = getFileURL();

        return (
            <div className="bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm">
                <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-300">
                    <span className="text-sm font-medium text-gray-700">Document Viewer</span>
                    <a
                        href={currentFileURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-purple-500 hover:text-purple-600 font-medium transition-colors"
                    ><ExternalLink size={15}/>Open in new tab</a>
                </div>
                <div className="bg-gray-100 p-1">
                    <iframe
                        src={currentFileURL}
                        className="w-full bg-white rounded border border-gray-300"
                        title="File Viewer"
                        frameBorder="0"
                        style={{
                            colorScheme: "light",
                            height: "calc(100vh - 220px)",
                            minHeight: "600px"
                        }}
                    />
                </div>
            </div>
        )
    };

    const renderAIChatAssistant = () => {
        return <AIChatInterface />;
    };

    const renderAIChatSummary = () => {
        return <AISummary />;
    };

    const renderQuizzesPage = () => {
        return <QuizManager documentId={id}/>;
    };

    const tabs = [
        { name: 'Content', label:'Content', content: renderContent() },
        { name: 'Chat', label: 'Chat', content: renderAIChatAssistant() },
        { name: 'Summary', label: 'Summary', content: renderAIChatSummary() },
        { name: 'Quizzes', label: 'Quizzes', content: renderQuizzesPage() }
    ];

    if (loading) {
        return <Spinner />;
    }

    if (!document) {
        return <div className="text-center p-8">The current document was not found.</div>;
    }

    return (
    <div>
        <div className="mb-4">
            <Link to="/documents" className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral=900 transition-colors">
                <ArrowLeft size={14} />
                Back
            </Link>
        </div>
        <PageHeader title={document.data.title} />
        <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
    )
}

export default DocumentDetailPage