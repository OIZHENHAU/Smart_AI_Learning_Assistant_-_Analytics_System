import Document from "../models/Document.js";
import Flashcard from "../models/Flashcard.js";
import Quiz from "../models/Quiz.js";
import { extractTextFromPDFFile } from '../utils/PdfParse.js';
import { chunkText } from "../utils/TextChunker.js";
import fs from 'fs/promises';

//Upload pdf document: POST /api/document/upload
export const uploadDocument = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Please upload a PDF file.',
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

        processPDF(currentDocumentId, req.file.path).catch(err => {
            console.error('Fail to processing the PDF file due to: ' + err);

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
                extractedText: currentDocument.extracted_text,
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

//Functon to process PDF file
async function processPDF(documentId, filePath) {
    try {
        const { text } = await extractTextFromPDFFile(filePath);

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
        console.error(`Fail to process the document with id: ${documentId} due to: " + error`);

        await Document.updateDocument(documentId, {
            extractedText: null,
            chunks: [],
            status: "failed"
        });

    }
}
