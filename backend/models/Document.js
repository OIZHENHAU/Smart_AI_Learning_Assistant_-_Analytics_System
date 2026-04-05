import db from '../config/MySQL.js';
//import { updateDocument } from '../controller/DocumentController.js';

const Document = {
    async createDocument({userId, title, fileName, filePath, fileSize, status}) {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const [documentResult] = await connection.execute(
                `INSERT INTO documents (user_id, title, file_name, file_path, file_size, status)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [userId, title, fileName, filePath, fileSize, status]
            );

            const documentId = documentResult.insertId;

            //Insert chunk
            // if (chunks && chunks.length > 0) {
            //     for (const chunk of chunks) {
            //         await connection.execute(
            //             `INSERT INTO document_chunks (document_id, content, page_number, chunk_index)
            //             VALUES (?, ?, ?, ?)`,
            //             [documentId, chunk.content, chunk.pageNumber || 0, chunk.chunkIndex]
            //         )
            //     }
            // }
            await connection.commit();
            return documentId;

        } catch (error) {
            //Rool back if anything fails
            await connection.rollback();
            console.error("Error when creating document: " + error);
            throw error;

        } finally {
            connection.release();
        }
    },

    async getAllDocuments(userId) {
        const connection = await db.getConnection();

        try {
            const [rows] = await connection.execute(
                `SELECT 
                    d.*, 
                    COUNT(DISTINCT f.id) AS flashcardCount,
                    COUNT(DISTINCT q.id) AS quizCount
                 FROM documents d
                 LEFT JOIN flashcards f ON f.document_id = d.id
                 LEFT JOIN quizzes q ON q.document_id = d.id
                 WHERE d.user_id = ?
                 GROUP BY d.id
                 ORDER BY d.last_accessed DESC
                `, [userId]
            );

            return rows

        } catch (error) {
            console.error("Error when getting all documents due to: " + error);
            throw error;

        } finally {
            connection.release();
        }
    },

    async updateDocument(documentId, {extractedText, chunks, status}) {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();
            
            //1.) Update maun dicument
            await connection.execute(
                `UPDATE documents
                 SET extracted_text = ?, status = ? WHERE id = ?`,
                 [extractedText, status, documentId]
            );

            //Delete old chunks (if reprocessing)
            await connection.execute(
                `DELETE FROM document_chunks WHERE document_id = ?`,
                [documentId]
            );

            //Insert new chunks
            if (chunks && chunks.length > 0) {
                for (const chunk of chunks) {
                    await connection.execute(
                        `INSERT INTO document_chunks
                         (document_id, content, chunk_index, page_number)
                         VALUES (?, ?, ?, ?)`,
                         [documentId, chunk.content, chunk.chunkIndex, chunk.pageNumber || 0]
                    );
                }
            }

            await connection.commit();

        } catch (error) {
            await connection.rollback();
            console.error(`Fail to update document with id: ${documentId} due to: ` + error);
            throw error;

        } finally {
            connection.release();
        }
    },

    async getParticularDocument(documentId) {
        const connection = await db.getConnection();

        try {
            //Only needed when during insert, update and delete
            //await connection.beginTransaction();
            const [result] = await connection.execute(
                `SELECT * FROM documents WHERE id = ?`, [documentId]
            );

            return result[0];

        } catch (error) {
            console.error(`Fail to get the particular document with id ${documentId} due to: ` + error);

        } finally {
            connection.release();
        }
    },

    async deleteDocument(documentId, userId) {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            //Delete document chunks
            await connection.execute(
                `DELETE FROM document_chunks WHERE document_id = ?`,
                [documentId]
            );

            //Delete document
            await connection.execute(
                `DELETE FROM documents
                 WHERE id = ? AND user_id = ?`,
                 [documentId, userId]
            );

            await connection.commit();

        } catch (error) {
            await connection.rollback();
            console.error(`Fail to delete document with id: ${documentId} due to: ` + error);
            throw error;

        } finally {
            connection.release();
        }

    }
}

export default Document;