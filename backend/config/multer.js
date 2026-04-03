import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDirectory = path.join(__dirname, '../uploads/documents');

if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, {recursive: true});

}

//Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDirectory);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 159);
        cb(null, `${uniqueSuffix}-${file.originalname}`)
    }
});

//File filter - only PDFs
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);

    } else {
        cb(new Error('Only PDF files are allowed!'), false);

    }
};

//Configure multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 //10MB by default
    }
});

export default upload;