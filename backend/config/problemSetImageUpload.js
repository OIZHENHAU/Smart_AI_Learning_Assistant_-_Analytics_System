import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDirectory = path.join(__dirname, '../uploads/problem-set-descriptions');

if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDirectory),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
        cb(null, `${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`);
    }
});

const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const uploadProblemSetImage = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (allowedTypes.includes(file.mimetype)) cb(null, true);
        else cb(new Error("Only JPG, PNG, GIF or WEBP images are allowed!"), false);
    },
    limits: { fileSize: 5 * 1024 * 1024 } //5MB
});

export default uploadProblemSetImage;
