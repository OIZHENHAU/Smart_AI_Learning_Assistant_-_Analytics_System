import express from 'express';
import protect from "../middleware/Auth.js";
import upload from "../config/multer.js";
import {
    uploadDocument,
    getDocument,
    getAllDocuments,
    updateDocument,
    deleteDocument,
} from "../controller/DocumentController.js";

const router = express.Router();
router.use(protect);
//Upload a document
router.post('/upload', upload.single('file'), uploadDocument);
//Get all document
router.get('/all-document', getAllDocuments);
//Get particular document
//router.get('/:id', getDocument);
//Update document
//router.put('/:id', updateDocument);
//Delete document
//router.delete(':/id', deleteDocument);

export default router;