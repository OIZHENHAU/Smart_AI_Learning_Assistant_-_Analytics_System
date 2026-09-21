import db from '../config/MySQL.js';

const SELECT_DOCUMENT = `SELECT d.id, d.class_id, d.title, d.file_name, d.original_name, d.file_path,
                                d.file_size, d.created_at, u.username AS uploader_name
                         FROM class_documents d
                         JOIN users u ON u.id = d.uploader_id`;

const SELECT_COMMENT = `SELECT c.id, c.document_id, c.parent_id, c.author_id, u.username AS author_name,
                               c.title, c.content, c.created_at, c.updated_at
                        FROM class_document_comments c
                        JOIN users u ON u.id = c.author_id`;

const ClassDocument = {
    async createDocument({ classId, uploaderId, title, fileName, originalName, filePath, fileSize }) {
        const [result] = await db.execute(
            `INSERT INTO class_documents (class_id, uploader_id, title, file_name, original_name, file_path, file_size, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [classId, uploaderId, title, fileName, originalName, filePath, fileSize, new Date()]
        );
        return result.insertId;
    },

    //search matches the title or the original file name, the dates filter on when the document was uploaded.
    async getDocuments(classId, { search, startDate, endDate } = {}) {
        let query = `${SELECT_DOCUMENT} WHERE d.class_id = ?`;
        const params = [classId];

        if (search && search.trim()) {
            query += ` AND (d.title LIKE ? OR d.original_name LIKE ?)`;
            params.push(`%${search.trim()}%`, `%${search.trim()}%`);
        }
        if (startDate) {
            query += ` AND DATE(d.created_at) >= ?`;
            params.push(startDate);
        }
        if (endDate) {
            query += ` AND DATE(d.created_at) <= ?`;
            params.push(endDate);
        }

        const [rows] = await db.execute(`${query} ORDER BY d.created_at DESC, d.id DESC`, params);
        return rows;
    },

    async getDocumentById(documentId) {
        const [rows] = await db.execute(`${SELECT_DOCUMENT} WHERE d.id = ?`, [documentId]);
        return rows[0];
    },

    //Read before a class is deleted, because the delete cascades the rows away but not the files.
    async getFileNamesByClass(classId) {
        const [rows] = await db.execute(`SELECT file_name FROM class_documents WHERE class_id = ?`, [classId]);
        return rows.map((row) => row.file_name);
    },

    async deleteDocument(documentId) {
        const [result] = await db.execute(`DELETE FROM class_documents WHERE id = ?`, [documentId]); //comments cascade
        return result;
    },

    //Threads newest first, each with its replies oldest first.
    async getComments(documentId) {
        const [rows] = await db.execute(
            `${SELECT_COMMENT} WHERE c.document_id = ? ORDER BY c.created_at ASC, c.id ASC`, [documentId]
        );

        const threads = rows.filter((row) => row.parent_id === null).map((thread) => ({ ...thread, replies: [] }));
        const threadById = new Map(threads.map((thread) => [thread.id, thread]));
        rows.filter((row) => row.parent_id !== null).forEach((reply) => threadById.get(reply.parent_id)?.replies.push(reply));

        return threads.reverse();
    },

    async getCommentById(commentId) {
        const [rows] = await db.execute(`${SELECT_COMMENT} WHERE c.id = ?`, [commentId]);
        return rows[0];
    },

    async createComment({ documentId, parentId, authorId, title, content }) {
        const [result] = await db.execute(
            `INSERT INTO class_document_comments (document_id, parent_id, author_id, title, content, created_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [documentId, parentId, authorId, title, content, new Date()]
        );
        return result.insertId;
    },

    async updateComment(commentId, { title, content }) {
        const [result] = await db.execute(
            `UPDATE class_document_comments SET title = ?, content = ?, updated_at = ? WHERE id = ?`,
            [title, content, new Date(), commentId]
        );
        return result;
    },

    async deleteComment(commentId) {
        const [result] = await db.execute(`DELETE FROM class_document_comments WHERE id = ?`, [commentId]); //replies cascade
        return result;
    }
};

export default ClassDocument;
