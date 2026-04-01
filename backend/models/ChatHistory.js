import db from '../config/MySQL.js';

const ChatHistory = {
    async createChatHistory({userId, documentId, messages, relevantChunks}) {
        try {
            const [result] = await db.execute(
                `INSERT INTO chat_histories (user_id, document_id)
                VALUES (?, ?)`,
                [userId, documentId]
            );

            const chatId = result.insertId;

            for(const msg of messages) {
                await db.execute(
                    `INSERT INTO messages (chat_id, role, content)
                    VALUES (?, ?, ?)`,
                    [chatId, msg.role, msg.content]
                );
            }

            //Insert the relevant chunk
            if (relevantChunks && relevantChunks.length > 0) {
                for(const chunkIndex of relevantChunks) {
                    await db.execute(
                        `INSERT INTO relevant_chunks (chat_id, document_id, chunk_index)
                        VALUES (?, ?)`,
                        [chatId, documentId, chunkIndex]
                    );
                }
            }
            return chatId;

        } catch (error) {
            console.error('Error creating chat history:', error);
            throw error;
        }
    },

    async getChatHistory(chatId) {
        try {
            const [rows] = await db.execute(
                `SELECT ch.id, ch.user_id, ch.document_id,
                    m.id AS message_id,
                    m.role, m.content, m.created_at,
                    rc.chunk_index
                 FROM chat_histories ch
                 LEFT JOIN messages m ON ch.id = m.chat_id
                 LEFT JOIN relevant_chunks rc ON ch.id = rc.chat_id
                 WHERE ch.id = ?
                 ORDER BY m.created_at ASC`, [chatId]
            );

            if (rows.length === 0) {
                return null;
            }

            const chat = {
                id: rows[0].id,
                userId: rows[0].user_id,
                documentId: rows[0].document_id,
                messages: [],
                relevantChunks: []
            };

            const messageMap = new Map();
            const relevantChunkSet = new Set();

            for (const row of rows) {
                //Handle messaage 
                if (row.message_id && !messageMap.has(row.message_id)) {
                    messageMap.set(row.message_id, {
                        role: row.role,
                        content: row.content,
                        timestamp: row.created_at
                    });
                }
                //Hanlde chunks from the doxcument
                if (row.chunk_index !== null) {
                    relevantChunkSet.add(row.chunk_index);
                }
            }
            chat.messages = Array.from(messageMap.values());
            chat.relevantChunks = Array.from(relevantChunkSet);

            return chat;

        } catch (error) {
            console.error('Error fetching chat history: ' + error);
            throw error
        }
    }
}

export default ChatHistory;