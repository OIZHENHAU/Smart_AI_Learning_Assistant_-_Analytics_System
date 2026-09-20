import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Announcement from '../models/Announcement.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGE_DIRECTORY = path.join(__dirname, '../uploads/announcements');
const IMAGE_MARKER = '/uploads/announcements/';
//Only the names our upload creates (e.g. 1789012345-482913.png), so nothing else can ever be deleted.
const IMAGE_NAME = /^\d+-\d+\.(jpe?g|png|gif|webp)$/;

//Every uploaded image file that an announcement's HTML points to.
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

//Deletes the files that no announcement uses any more. A file another announcement still shows is kept.
export const deleteUnusedImages = async (filenames, exceptAnnouncementId = 0) => {
    for (const filename of filenames) {
        try {
            if (await Announcement.isImageUsed(filename, exceptAnnouncementId)) continue;
            await fs.unlink(path.join(IMAGE_DIRECTORY, filename));

        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error(`Fail to delete the announcement image ${filename} due to: ` + error);
            }
        }
    }
};
