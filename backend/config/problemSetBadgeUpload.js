import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import fsPromises from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDirectory = path.join(__dirname, '../uploads/problem-set-badges');

if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}

//Only names our upload creates (e.g. 1789012345678-482913.png), so nothing else can ever be deleted.
const STORED_NAME = /^\d+-\d+\.(jpe?g|png|gif|webp)$/;

export const removeBadgeFile = async (fileName) => {
    if (!fileName || !STORED_NAME.test(fileName)) {
        return;
    }
    try {
        await fsPromises.unlink(path.join(uploadDirectory, fileName));

    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.error(`Fail to delete the badge file ${fileName} due to: ` + error);
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

const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const uploadBadgeImage = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);

        } else {
            cb(new Error("Only JPG, PNG, GIF or WEBP images are allowed!"), false);
        }
    },
    limits: { fileSize: 2 * 1024 * 1024 } //2MB
});

export default uploadBadgeImage;
