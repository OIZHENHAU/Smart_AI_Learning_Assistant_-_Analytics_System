import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPath";

const getAllDocuments = async () => {
    try {
        const response = await axiosInstance.get(API_PATHS.DOCUMENT.GET_ALL_DOCUMENT);
        return response.data;

    } catch (error) {
        console.error("Fail to fetch all documents at the frontend due to: " + error);
        throw error;
    }
};

const uploadDocument = async (formData) => {
    try {
        const response = await axiosInstance.get(API_PATHS.DOCUMENT.UPLOAD, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data;

    } catch (error) {
        console.error("Fail to upload the document at the frontend due to: " + error);
        throw error;
    }
};

const deleteDocument = async (id) => {
    try {
        const response = await axiosInstance.get(API_PATHS.DOCUMENT.DELETE_DOCUMENT(id));

        return response.data;

    } catch (error) {
        console.error("Fail to delete the docuemtn at the frontend due to: " + error);
        throw error;
    }
};

const getDocumentById = async (id) => {
    try {
        const response = await axiosInstance.get(API_PATHS.DOCUMENT.GET_DOCUMENT_BY_ID(id));

        return response.data;

    } catch (error) {
        console.error("Fail to get the paritcular docuemnt at the frontend due to: " + error);
        throw error;
    }
};

const documentService = {
    getAllDocuments, getDocumentById, uploadDocument, deleteDocument
};

export default documentService;