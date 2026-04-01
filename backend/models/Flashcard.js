import db from '../config/MySQL.js';

const Flashcard = {
    async createFlashcards({userId, documentId, cards}) {
        //Insert Flashcard Set
        const [result] = await db.execute(
            `INSERT INTO flashcards (user_id, document_id)
             VALUES (?, ?)`,
             [userId, documentId]
        );

        const flashcardId = result.insertId;

        //Insert card
        for (const card of cards) {
            await db.execute(
                `INSERT INTO flashcard_items (flashcard_id, question, answer, difficulty, last_reviewed, review_count, is_started)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                 [flashcardId, card.question, card.answer, card.difficulty || "medium", 
                    card.lastReviewed || null, card.reviewCount || 0, card.isStarted ? 1 : 0]
            );
        }
        return flashcardId;
    },

    async getFlashcardsByUser({userId, documentId}) {
        const [flashcards] = await db.execute(
            `SELECT * FROM flashcards
             WHERE user_id = ? AND document_id = ?`,
             [userId, documentId]
        );

        if (flashcards.length === 0) {
            return null;
        }

        const flashcard = flashcards[0];

        const [cards] = await db.execute(
            `SELECT * FROM flashcard_items WHERE flashcard_id = ?`, [flashcard.id]
        );

        return {
            ...flashcard, cards
        }
    }
}

export default Flashcard;