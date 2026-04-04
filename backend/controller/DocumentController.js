import Document from "../models/Document.js";
import Flashcard from "../models/Flashcard.js";
import Quiz from "../models/Quiz.js";
import { extractTextFromPDFFile } from '../utils/PdfParse.js';
//import { extractTextFromPDFFile } from '../utils/PdfParse.js';
import { extractTextFromWord } from '../utils/WordParser.js';
import { extractTextFromPPT } from '../utils/PptParser.js';
import { chunkText } from "../utils/TextChunker.js";
import fs from 'fs/promises';

//Upload pdf document: POST /api/document/upload
export const uploadDocument = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: "Please upload a file.",
                statusCode: 400
            });
        }

        const fileType = getFileType(req.file);

        if (fileType === "unsupported") {
            await fs.unlink(req.file.path);

            return res.status(400).json({
                success: false,
                error: "Unsupported file type. Only PDF, DOCX, PPTX allowed.",
                statusCode: 400
            });
        }

        const { title } = req.body;

        if (!title) {
            //Delete uplaod file if no title was provided
            await fs.unlink(req.file.path);

            return res.status(400).json({
                success: false,
                error: "Please provide a document title.",
                statusCode: 400
            });
        }

        //VCpnstruct the URL for the uploaded file
        const fileName = req.file.filename;
        const baseURL = `http://localhost:${process.env.PORT || 5528}`;
        const fileURL = `${baseURL}/uploads/documents/${fileName}`;

        const currentDocumentId = await Document.createDocument({
            userId: req.user.id,
            title,
            fileName: fileName,
            filePath: fileURL,
            fileSize: req.file.size,
            status: 'processing'
        });

        processDocument(currentDocumentId, req.file.path, fileType).catch(err => {
            console.error('Fail to processing the file due to: ' + err);

        });

        const currentDocument = await Document.getParticularDocument(currentDocumentId);

        if (!currentDocument) {
            return res.status(404).json({
                success: false,
                error: "Document not found.",
                statusCode: 404
            });
        }

        res.status(201).json({
            success: true,
            data: {
                userId: currentDocument.user_id,
                title: currentDocument.title,
                fileName: currentDocument.file_name,
                filePath: currentDocument.file_path,
                fileSize: currentDocument.file_size,
                status: currentDocument.status,
                uploadDate: currentDocument.upload_date,
                lastAccess: currentDocument.last_accessed
            },

            message: "The document was uploaded swuccessfully! Processing the request....",
            statusCode: 201
        })

    } catch (error) {
        //Clean up file on error
        if (req.file) {
            const filePath = req.file.path;
            await fs.unlink(filePath).catch(() => {});
        }
        next(error);
    }
};

//Get all documents GET /api/documents
export const getAllDocuments = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const allDocuments = await Document.getAllDocuments(userId);

        res.status(200).json({
            success: true,
            count: allDocuments.length,
            data: allDocuments,
            statusCode: 200
        });
        
    } catch (error) {
        console.error("Fail to retrieve all document due to: " + error);
        next(error);
    }
}

//Get a particular document GET /api/document/:id
export const getDocument = async (req, res, next) => {
    try {

    } catch (error) {
        console.error("Fail to retrieve the document due to: " + error);
        next(error);
    }
}

//Update a particular document PUT /api/document/:id
export const updateDocument = async (req, res, next) => {
    try {

    } catch (error) {
        console.error("Fail to update the document due to: " + error);
        next(error);
    }
}

//Delete a particulat document DELETE /api/document/:id
export const deleteDocument = async (req, res, next) => {
    try {

    } catch (error) {
        console.error("Fail to delete the document due to: " + error);
        next(error);
    }
}

//Functon to process PDF, Word, PowerPoint file
async function processDocument(documentId, filePath, fileType) {
    try {
        let text = "";

        if (fileType === "pdf") {
            const { text: pdfText } = await extractTextFromPDFFile(filePath);
            text = pdfText;

        } else if (fileType === "docx") {
            text = await extractTextFromWord(filePath);

        } else if (fileType === "pptx") {
            text = await extractTextFromPPT(filePath);

        }

        // Safety check
        if (!text || text.trim().length === 0) {
            console.warn(`Empty text extracted for document ${documentId}`);
            throw new Error("No text extracted from file");
        }

        //Create chunks
        const chunks = chunkText(text, 500, 50);

        await Document.updateDocument(documentId, {
            extractedText: text,
            chunks: chunks,
            status: 'ready'
        });

        const successMessage = `Document with id: ${documentId} process successfully!`;
        console.log(successMessage);

    } catch (error) {
        console.error(`Fail to process the document with id: ${documentId} due to: ` + error);

        await Document.updateDocument(documentId, {
            extractedText: null,
            chunks: [],
            status: "failed"
        });

    }
}

//Upload file based on pdf, word, or powerpoint
const getFileType = (file) => {
    const mime = file.mimetype;
    const ext = file.originalname.split('.').pop().toLowerCase();

    // PDF
    if (mime === "application/pdf" || ext === "pdf") {
        return "pdf";
    }

    // Word
    if (
        mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        ext === "docx"
    ) {
        return "docx";
    }

    // PowerPoint
    if (
        mime === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
        ext === "pptx"
    ) {
        return "pptx";
    }

    return "unsupported";
};