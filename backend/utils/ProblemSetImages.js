import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import ProblemSet from '../models/ProblemSet.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGE_DIRECTORY = path.join(__dirname, '../uploads/problem-set-descriptions');
const IMAGE_MARKER = '/uploads/problem-set-descriptions/';
//Only the names our upload creates (e.g. 1789012345-482913.png), so nothing else can ever be deleted.
const IMAGE_NAME = /^\d+-\d+\.(jpe?g|png|gif|webp)$/;

//Every uploaded image file that a question description's HTML points to.
export const extractImageFilenames = (html = '') => {
    const filenames = new Set();

    for (const match of html.matchAll(/<img[^>]+src="([^"]+)"/gi)) {
        const index = match[1].indexOf(IMAGE_MARKER);
        if (index === -1) continue;

        const filename = match[1].slice(index + IMAGE_MARKER.length);
        if (IMAGE_NAME.test(filename)) filenames.add(filename);
    }

    return [...filenames];
};

//Deletes the files that no question description uses any more. A file another question still shows is kept.
export const deleteUnusedImages = async (filenames, exceptQuestionId = 0) => {
    for (const filename of filenames) {
        try {
            if (await ProblemSet.isImageUsed(filename, exceptQuestionId)) continue;
            await fs.unlink(path.join(IMAGE_DIRECTORY, filename));

        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error(`Fail to delete the problem set image ${filename} due to: ` + error);
            }
        }
    }
};
