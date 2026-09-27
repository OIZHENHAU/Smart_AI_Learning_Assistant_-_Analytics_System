import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import fsPromises from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDirectory = path.join(__dirname, '../uploads/problem-set-files');

if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}

//Checked by extension, not mimetype: browsers send .ipynb (and sometimes .zip) as application/octet-stream.
const ALLOWED_EXTENSIONS = ['.pdf', '.ipynb', '.zip'];
//Only names our upload creates (e.g. 1789012345678-482913.pdf), so nothing else can ever be deleted.
const STORED_NAME = /^\d+-\d+\.(pdf|ipynb|zip)$/;

export const removeQuestionFile = async (fileName) => {
    if (!fileName || !STORED_NAME.test(fileName)) {
        return;
    }
    try {
        await fsPromises.unlink(path.join(uploadDirectory, fileName));

    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.error(`Fail to delete the question file ${fileName} due to: ` + error);
        }
    }
};

export const removeQuestionFiles = (fileNames) => Promise.all(fileNames.map(removeQuestionFile));

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDirectory),
    filename: (req, file, cb) => {
        //multer reads the original name as latin1; turn it back into UTF-8 so non-English names display correctly.
        file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
        cb(null, `${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`);
    }
});

const uploadQuestionFileMiddleware = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (ALLOWED_EXTENSIONS.includes(path.extname(file.originalname).toLowerCase())) {
            cb(null, true);

        } else {
            cb(new Error("Only PDF, Jupyter Notebook (.ipynb) or ZIP files are allowed!"), false);
        }
    },
    limits: { fileSize: 50 * 1024 * 1024 } //50MB
});

export default uploadQuestionFileMiddleware;
