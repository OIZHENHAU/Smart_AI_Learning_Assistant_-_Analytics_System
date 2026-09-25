import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPath";

const request = async (call, action) => {
    try {
        const response = await call();
        return response.data;

    } catch (error) {
        console.error(`Fail to ${action} at the service due to: ` + error);
        throw error.response?.data || error;
    }
};

const getDocuments = (classId, filters = {}) =>
    request(() => axiosInstance.get(API_PATHS.CLASS.DOCUMENTS(classId), { params: filters }), "get the class documents");

const getDocument = (classId, id) =>
    request(() => axiosInstance.get(API_PATHS.CLASS.DOCUMENT_BY_ID(classId, id)), "get the class document");

const uploadDocument = (classId, formData) =>
    request(() => axiosInstance.post(API_PATHS.CLASS.DOCUMENTS(classId), formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }), "upload the class document");

const deleteDocument = (classId, id) =>
    request(() => axiosInstance.delete(API_PATHS.CLASS.DOCUMENT_BY_ID(classId, id)), "delete the class document");

const getComments = (classId, id) =>
    request(() => axiosInstance.get(API_PATHS.CLASS.DOCUMENT_COMMENTS(classId, id)), "get the comments");

const createComment = (classId, id, payload) =>
    request(() => axiosInstance.post(API_PATHS.CLASS.DOCUMENT_COMMENTS(classId, id), payload), "post the comment");

const updateComment = (classId, id, commentId, payload) =>
    request(() => axiosInstance.put(API_PATHS.CLASS.DOCUMENT_COMMENT_BY_ID(classId, id, commentId), payload), "update the comment");

const deleteComment = (classId, id, commentId) =>
    request(() => axiosInstance.delete(API_PATHS.CLASS.DOCUMENT_COMMENT_BY_ID(classId, id, commentId)), "delete the comment");

const classDocumentService = {
    getDocuments, getDocument, uploadDocument, deleteDocument,
    getComments, createComment, updateComment, deleteComment
};

export default classDocumentService;
