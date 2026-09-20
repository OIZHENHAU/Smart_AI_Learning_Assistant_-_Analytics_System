import db from '../config/MySQL.js';

const SELECT_ANNOUNCEMENT = `SELECT a.id, a.class_id, a.author_id, u.username AS author_name,
                                    a.title, a.content, a.created_at, a.updated_at
                            FROM class_announcements a
                            JOIN users u ON u.id = a.author_id`;

const Announcement = {
    async createAnnouncement({ classId, authorId, title, content, contentText }) {
        const [result] = await db.execute(
            `INSERT INTO class_announcements (class_id, author_id, title, content, content_text, created_at)
                VALUES (?, ?, ?, ?, ?, ?)`,
            [classId, authorId, title, content, contentText, new Date()]
        );
        return result.insertId;
    },

    //Returns one page of announcements plus the total number that match the search.
    //page and pageSize are whole numbers checked by the controller, so they are safe to put in LIMIT/OFFSET.
    async getAnnouncement({ classId, search, startDate, endDate, page = 1, pageSize = 10 }) {
        const conditions = [`a.class_id = ?`];
        const params = [classId];

        if (search && search.trim()) {
            conditions.push(`(a.title LIKE ? OR a.content_text LIKE ?)`);
            params.push(`%${search.trim()}%`, `%${search.trim()}%`);
        }

        if (startDate) {
            conditions.push(`DATE(a.created_at) >= ?`);
            params.push(startDate);
        }

        if (endDate) {
            conditions.push(`DATE(a.created_at) <= ?`);
            params.push(endDate);
        }

        const where = conditions.join(' AND ');
        const offset = (page - 1) * pageSize;

        const [[{ total }]] = await db.execute(
            `SELECT COUNT(*) AS total FROM class_announcements a WHERE ${where}`, params
        );

        const [rows] = await db.execute(
            `
            ${SELECT_ANNOUNCEMENT} WHERE ${where}
            ORDER BY a.created_at DESC, a.id DESC
            LIMIT ${pageSize} OFFSET ${offset}
            `,
            params
        );

        return { rows, total };
    },

    async getAnnouncementById(announcementId) {
        const [rows] = await db.execute(`${SELECT_ANNOUNCEMENT} WHERE a.id = ?`, [announcementId]);
        return rows[0];
    },

    //The content of every announcement in a class, only used to remove their images when the class is deleted.
    async getContentByClass(classId) {
        const [rows] = await db.execute(`SELECT content FROM class_announcements WHERE class_id = ?`, [classId]);
        return rows;
    },

    //Does any other announcement still show this image file
    async isImageUsed(filename, exceptAnnouncementId = 0) {
        const [rows] = await db.execute(
            `SELECT 1 FROM class_announcements WHERE id != ? AND content LIKE ? LIMIT 1`,
            [exceptAnnouncementId, `%/uploads/announcements/${filename}%`]
        );
        return rows.length > 0;
    },

    async updateAnnouncement(announcementId, { title, content, contentText }) {
        const [result] = await db.execute(
            `
            UPDATE class_announcements
            SET title = ?, content = ?, content_text = ?, updated_at = ?
            WHERE id = ?`,
            [title, content, contentText, new Date(), announcementId]
        );
        return result;
    },

    async deleteAnnouncement(announcementId) {
        const [result] = await db.execute(`DELETE FROM class_announcements WHERE id = ?`, [announcementId]);
        return result;
    }
};

export default Announcement;
