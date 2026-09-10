import db from '../config/MySQL.js';

const Flashcard = {
    async createFlashcards({userId, documentId, cards}) {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            //Insert Flashcard Set
            const [result] = await connection.execute(
                `INSERT INTO flashcards (user_id, document_id)
                 VALUES (?, ?)`,
                 [userId, documentId]
            );

            const flashcardId = result.insertId;

            //Insert card
            for (const card of cards) {
                await connection.execute(
                    `INSERT INTO flashcard_items (flashcard_id, question, answer, difficulty, last_reviewed, review_count, is_started)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                     [flashcardId, card.question, card.answer, card.difficulty || "medium",
                        card.lastReviewed || null, card.reviewCount || 0, card.isStarted ? 1 : 0]
                );
            }

            await connection.commit();
            return flashcardId;

        } catch (error) {
            await connection.rollback();
            console.error("Fail to create the flashcard set due to: " + error);
            throw error;

        } finally {
            connection.release();
        }
    },

    async getFlashcardsDocument(userId, documentId) {
        const [flashcards] = await db.execute(
            `SELECT f.*, d.title
             FROM flashcards f
             JOIN documents d ON f.document_id = d.id
             WHERE f.user_id = ? AND f.document_id = ?`,
             [userId, documentId]
        );

        const result = [];

        for(const flashcard of flashcards) {
            const [cards] = await db.execute(
                `SELECT * FROM flashcard_items WHERE flashcard_id = ?`,
                [flashcard.id]
            );

            result.push({
                ...flashcard,
                cards
            });
        }

        return result;
    },

    async getAllFlashcards(userId) {
        const [flashcards] = await db.execute(
            `SELECT f.id, f.document_id, f.created_at, d.title
             FROM flashcards f
             JOIN documents d ON f.document_id = d.id
             WHERE f.user_id = ?
             ORDER BY f.created_at DESC`,
             [userId]
        );

        const result = [];

        for (const flashcard of flashcards) {
            const [cards] = await db.execute(`
                SELECT id, question, answer, difficulty, review_count, is_started
                FROM flashcard_items
                WHERE flashcard_id = ?`, [flashcard.id]);

            result.push({
                ...flashcard,
                cards
            });
        }

        return result;
    },

    async reviewFlashcard(cardId, userId) {
        const [rows] = await db.execute(
            `SELECT fi.id
             FROM flashcard_items fi
             JOIN flashcards f ON fi.flashcard_id = f.id
             WHERE fi.id = ? AND f.user_id = ?`,
             [cardId, userId]
        );

        //Only update once we know the card exists and belongs to the user
        if (rows.length === 0) {
            return rows;
        }

        await db.execute(
            `UPDATE flashcard_items
             SET last_reviewed = NOW(),
                 review_count = review_count + 1
             WHERE id = ?`,
             [cardId]
        );

        return rows;
    },

    async getFlashCardItem(userId, cardId) {
        const [rows] = await db.execute(
            `SELECT fi.is_started
             FROM flashcard_items fi
             JOIN flashcards f ON fi.flashcard_id = f.id
             WHERE fi.id = ? AND f.user_id = ?`,
             [cardId, userId]
        );

        return rows;
    },

    async toggleStarFlashcard(cardId, starValue) {
        await db.execute(
            `UPDATE flashcard_items
             SET is_started = ?
             WHERE id = ?`,
             [starValue, cardId]
        );

        return starValue;
    },

    async getParticularFlashcards(flashcardId, userId) {
        const [rows] = await db.execute(
            `SELECT id FROM flashcards
             WHERE id = ? AND user_id = ?`,
             [flashcardId, userId]
        );

        return rows;
    },

    async deleteFlashcard(flashcardId) {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            //Delete all card item related to flashcard id
            await connection.execute(
                `DELETE FROM flashcard_items WHERE flashcard_id = ?`, [flashcardId]
            );

            //Delete the falshcard based on id
            await connection.execute(
                `DELETE FROM flashcards WHERE id = ?`, [flashcardId]
            );

            await connection.commit();
            return flashcardId;

        } catch (error) {
            await connection.rollback();
            console.error(`Fail to delete flashcard set with id: ${flashcardId} due to: ` + error);
            throw error;

        } finally {
            connection.release();
        }
    },

    async countDocumentFlashcard(documentId, userId) {
        const [rows] = await db.execute(`
            SELECT COUNT(*) AS total
            FROM flashcards
            WHERE document_id = ? AND user_id = ?`,
            [documentId, userId]
        );

        return rows[0].total;
    }
}

export default Flashcard;