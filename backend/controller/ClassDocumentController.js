import sanitizeHTML from 'sanitize-html';
import ClassDocument from '../models/ClassDocument.js';
import { removeClassDocumentFiles } from '../config/classDocumentUpload.js';
import { getClassAccess, sendError, COMMENT_CLEAN_OPTIONS } from '../utils/ClassAccess.js';

//Same text without any tags, so an empty <p></p> does not count as a comment.
const toPlainText = (html) =>
    sanitizeHTML(html.replace(/<\/(p|li|h[1-3]|blockquote)>/gi, ' '), { allowedTags: [], allowedAttributes: {} }).trim();

//Checks the caller can open the class and that the document belongs to it.
const loadDocument = async (req) => {
    const access = await getClassAccess(req.params.id, req.user);
    if (access.error) return access;

    const document = await ClassDocument.getDocumentById(req.params.documentId);
    if (!document || document.class_id !== access.classroom.id) {
        return { status: 404, error: "Document not found." };
    }

    return { ...access, document };
};

//Same check as loadDocument, plus the comment must belong to that document.
const loadComment = async (req) => {
    const result = await loadDocument(req);
    if (result.error) return result;

    const comment = await ClassDocument.getCommentById(req.params.commentId);
    if (!comment || comment.document_id !== result.document.id) {
        return { status: 404, error: "Comment not found." };
    }

    return { ...result, comment };
};

//Validates and cleans a comment, returns { title, content } or { error }. Only a thread has a title.
const readCommentBody = (body, isReply) => {
    const content = sanitizeHTML(body.content || '', COMMENT_CLEAN_OPTIONS);
    const title = isReply ? null : (body.title || '').trim();

    if (!isReply && (!title || title.length > 255)) return { error: "Title is required and must be at most 255 characters." };
    if (!toPlainText(content)) return { error: "Please write your comment." };

    return { title, content };
};

//Get the documents of a class: GET /api/classes/:id/documents?search=&startDate=&endDate=
export const getClassDocuments = async (req, res, next) => {
    try {
        const access = await getClassAccess(req.params.id, req.user);
        if (access.error) return sendError(res, access.status, access.error);

        const { search, startDate, endDate } = req.query;
        const data = await ClassDocument.getDocuments(access.classroom.id, { search, startDate, endDate });

        res.status(200).json({
            success: true,
            message: "Documents retrieved successfully.",
            data,
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to get the class documents at the controller due to: " + error);
        next(error);
    }
};

//Upload a document (multipart: file + title): POST /api/classes/:id/documents
export const createClassDocument = async (req, res, next) => {
    try {
        const access = await getClassAccess(req.params.id, req.user);
        if (access.error || !access.canManage) {
            await removeClassDocumentFiles(req.file ? [req.file.filename] : []);
            return access.error
                ? sendError(res, access.status, access.error)
                : sendError(res, 403, "Only lecturer, parents or admin can upload documents.");
        }

        if (!req.file) return sendError(res, 400, "Please upload a file.");

        const title = (req.body.title || '').trim();
        if (!title || title.length > 255) {
            await removeClassDocumentFiles([req.file.filename]);
            return sendError(res, 400, "Title is required and must be at most 255 characters.");
        }

        const filePath = `http://localhost:${process.env.PORT || 5528}/uploads/class-documents/${req.file.filename}`;
        const id = await ClassDocument.createDocument({
            classId: access.classroom.id,
            uploaderId: req.user.id,
            title,
            fileName: req.file.filename,
            originalName: req.file.originalname,
            filePath,
            fileSize: req.file.size
        });

        res.status(201).json({
            success: true,
            message: "Document uploaded successfully.",
            data: { id },
            statusCode: 201
        });

    } catch (error) {
        console.error("Fail to upload the class document at the controller due to: " + error);
        next(error);
    }
};

//Get one document: GET /api/classes/:id/documents/:documentId
export const getClassDocument = async (req, res, next) => {
    try {
        const result = await loadDocument(req);
        if (result.error) return sendError(res, result.status, result.error);

        res.status(200).json({
            success: true,
            message: "Document retrieved successfully.",
            data: result.document,
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to get the class document at the controller due to: " + error);
        next(error);
    }
};

//Delete a document and its comments: DELETE /api/classes/:id/documents/:documentId
export const deleteClassDocument = async (req, res, next) => {
    try {
        const result = await loadDocument(req);
        if (result.error) return sendError(res, result.status, result.error);
        if (!result.canManage) return sendError(res, 403, "Only lecturer, parents or admin can delete documents.");

        await ClassDocument.deleteDocument(result.document.id);
        await removeClassDocumentFiles([result.document.file_name]);

        res.status(200).json({
            success: true,
            message: "Document deleted successfully.",
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to delete the class document at the controller due to: " + error);
        next(error);
    }
};

//Get the comment threads of a document: GET /api/classes/:id/documents/:documentId/comments
export const getComments = async (req, res, next) => {
    try {
        const result = await loadDocument(req);
        if (result.error) return sendError(res, result.status, result.error);

        const data = await ClassDocument.getComments(result.document.id);

        res.status(200).json({
            success: true,
            message: "Comments retrieved successfully.",
            data,
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to get the comments at the controller due to: " + error);
        next(error);
    }
};

//Post a comment thread, or a reply when parentId is given: POST /api/classes/:id/documents/:documentId/comments
export const createComment = async (req, res, next) => {
    try {
        const result = await loadDocument(req);
        if (result.error) return sendError(res, result.status, result.error);

        const parentId = req.body.parentId ? Number(req.body.parentId) : null;
        if (parentId !== null) {
            //A reply must point to a thread of this same document (replies can't be replied to).
            const parent = Number.isInteger(parentId) ? await ClassDocument.getCommentById(parentId) : null;
            if (!parent || parent.document_id !== result.document.id || parent.parent_id !== null) {
                return sendError(res, 404, "Comment not found.");
            }
        }

        const body = readCommentBody(req.body, parentId !== null);
        if (body.error) return sendError(res, 400, body.error);

        const id = await ClassDocument.createComment({
            documentId: result.document.id, parentId, authorId: req.user.id, ...body
        });

        res.status(201).json({
            success: true,
            message: "Comment posted successfully.",
            data: { id },
            statusCode: 201
        });

    } catch (error) {
        console.error("Fail to post the comment at the controller due to: " + error);
        next(error);
    }
};

//Edit a comment (its author only): PUT /api/classes/:id/documents/:documentId/comments/:commentId
export const updateComment = async (req, res, next) => {
    try {
        const result = await loadComment(req);
        if (result.error) return sendError(res, result.status, result.error);
        if (result.comment.author_id !== req.user.id) return sendError(res, 403, "You can only edit your own comment.");

        const body = readCommentBody(req.body, result.comment.parent_id !== null);
        if (body.error) return sendError(res, 400, body.error);

        await ClassDocument.updateComment(result.comment.id, body);

        res.status(200).json({
            success: true,
            message: "Comment updated successfully.",
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to update the comment at the controller due to: " + error);
        next(error);
    }
};

//Delete a comment (its author, or lecturer/parents/admin): DELETE /api/classes/:id/documents/:documentId/comments/:commentId
export const deleteComment = async (req, res, next) => {
    try {
        const result = await loadComment(req);
        if (result.error) return sendError(res, result.status, result.error);
        if (result.comment.author_id !== req.user.id && !result.canManage) {
            return sendError(res, 403, "You cannot delete this comment.");
        }

        await ClassDocument.deleteComment(result.comment.id);

        res.status(200).json({
            success: true,
            message: "Comment deleted successfully.",
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to delete the comment at the controller due to: " + error);
        next(error);
    }
};
