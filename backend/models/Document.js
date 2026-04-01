import db from '../config/MySQL.js';

const Document = {
    async createDocumentWithChunk({userId, title, fileName, filePath, fileSize, chunks}) {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const [documentResult] = await connection.execute(
                `INSERT INTO documents (user_id, title, file_name, file_path, file_size)
                VALUES (?, ?, ?, ?, ?)`,
                [userId, title, fileName, filePath, fileSize]
            );

            const documentId = documentResult.insertId;

            //Insert chunk
            if (chunks && chunks.length > 0) {
                for (const chunk of chunks) {
                    await connection.execute(
                        `INSERT INTO document_chunks (document_id, content, page_number, chunk_index)
                        VALUES (?, ?, ?, ?)`,
                        [documentId, chunk.content, chunk.pageNumber || 0, chunk.chunkIndex]
                    )
                }
            }
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
    }
}

export default Document;