import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import fsPromises from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDirectory = path.join(__dirname, '../uploads/class-documents');

if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}

//Only names our upload creates (e.g. 1789012345678-482913.pdf), so nothing else can ever be deleted.
const STORED_NAME = /^\d+-\d+\.(pdf|docx|pptx)$/;

//Deletes uploaded class document files, a missing file is not an error.
export const removeClassDocumentFiles = async (fileNames = []) => {
    for (const fileName of fileNames) {
        if (!STORED_NAME.test(fileName)) continue;

        try {
            await fsPromises.unlink(path.join(uploadDirectory, fileName));

        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error(`Fail to delete the class document file ${fileName} due to: ` + error);
            }
        }
    }
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDirectory),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
        cb(null, `${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`);
    }
});

const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation"
];

const uploadClassDocument = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (allowedTypes.includes(file.mimetype)) cb(null, true);
        else cb(new Error("Only PDF, DOCX, PPTX allowed!"), false);
    },
    limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 } //10MB by default
});

export default uploadClassDocument;
