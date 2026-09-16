import db from '../config/MySQL.js';

const gainXPBasedOnDifficulty = {
    easy: { level_point: 10 },
    medium: { level_point: 20 },
    hard: { level_point: 30 }
};

const FillInBlank = {
    // questions: [{ questionText, blanks: ['applications', 'physical', ...], distractors: ['pointer', 'output', ...],
    //               hints, explanation, difficulty, topic }]
    async createSet({ userId, documentId, title, questions }) {
        let totalXPGain = 0;

        for (const q of questions) {
            const difficulty = gainXPBasedOnDifficulty[q.difficulty || 'medium'];
            totalXPGain += difficulty.level_point * q.blanks.length;
        }

        const TIME_PER_BLANK_SECONDS = 20;
        const duration_seconds = questions.reduce((sum, q) => sum + q.blanks.length, 0) * TIME_PER_BLANK_SECONDS;

        const [setResult] = await db.execute(
            `
            INSERT INTO fill_blank_sets (user_id, document_id, title, total_questions, num_xp, duration_seconds)
            VALUES (?, ?, ?, ?, ?, ?)
            `, [userId, documentId, title, questions.length, totalXPGain, duration_seconds]
        );
        const setId = setResult.insertId;

        for (const q of questions) {
            const questionXP = gainXPBasedOnDifficulty[q.difficulty || 'medium'].level_point * q.blanks.length;

            const [questionResult] = await db.execute(
                `INSERT INTO fill_blank_questions (set_id, question_text, num_blanks, hints, explanation, difficulty, topic, num_xp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [setId, q.questionText, q.blanks.length, q.hints || null, q.explanation || null, q.difficulty || 'medium', q.topic || null, questionXP]
            );

            const questionId = questionResult.insertId;

            //Correct words, tagged with the blank order they belong to
            for (let i = 0; i < q.blanks.length; i++) {
                await db.execute(
                    `INSERT INTO fill_blank_words (question_id, word_text, correct_blank_order) VALUES (?, ?, ?)`,
                    [questionId, q.blanks[i], i + 1]
                );
            }

            //Distractor words, shown in the same word bank but with no correct blank
            for (const distractor of (q.distractors || [])) {
                await db.execute(
                    `INSERT INTO fill_blank_words (question_id, word_text, correct_blank_order) VALUES (?, ?, NULL)`,
                    [questionId, distractor]
                );
            }
        }

        return setId;
    },

    async getAllSets({ userId }) {
        const [sets] = await db.execute(
            `
            SELECT fs.id, fs.title, fs.score, fs.total_questions, fs.completed_at, fs.created_at, fs.num_xp,
            d.title AS document_title, d.file_name, fs.duration_seconds
            FROM fill_blank_sets fs
            JOIN documents d
                ON fs.document_id = d.id
            WHERE fs.user_id = ?
            ORDER BY fs.created_at DESC
            `,
            [userId]
        );

        return sets;
    },

    async getSetsByDocument({ userId, documentId }) {
        const [sets] = await db.execute(
            `
            SELECT fs.id, fs.title, fs.score, fs.total_questions, fs.completed_at, fs.created_at, fs.num_xp,
            d.title AS document_title, d.file_name, fs.duration_seconds
            FROM fill_blank_sets fs
            JOIN documents d
                ON fs.document_id = d.id
            WHERE fs.user_id = ?
            AND fs.document_id = ?
            ORDER BY fs.created_at DESC
            `,
            [userId, documentId]
        );

        return sets;
    },

    async getSetById({ setId }) {
        const [sets] = await db.execute(`SELECT * FROM fill_blank_sets WHERE id = ?`, [setId]);

        if (sets.length === 0) {
            return null;
        }

        const [questions] = await db.execute(`SELECT * FROM fill_blank_questions WHERE set_id = ?`, [setId]);

        for (const q of questions) {
            const [words] = await db.execute(
                `SELECT word_text FROM fill_blank_words WHERE question_id = ?`,
                [q.id]
            );

            //Shuffle so the correct words aren't grouped together in the bank
            q.wordBank = words.map(w => w.word_text).sort(() => Math.random() - 0.5);
        }

        return {
            ...sets[0],
            questions: questions.map(q => ({
                id: q.id,
                questionText: q.question_text,
                numBlanks: q.num_blanks,
                wordBank: q.wordBank,
                explanation: q.explanation,
                difficulty: q.difficulty,
                topic: q.topic,
                num_xp: q.num_xp,
                has_hint: q.has_hint,
                has_protected: q.has_protected
            }))
        };
    },

    //The correct word for one specific blank of one question
    async getCorrectWord({ questionId, blankOrder }) {
        const [rows] = await db.execute(
            `SELECT word_text FROM fill_blank_words WHERE question_id = ? AND correct_blank_order = ?`,
            [questionId, blankOrder]
        );

        return rows[0]?.word_text || null;
    },

    async getSetHintByQuestionId({ setId, questionId, userId }) {
        const connection = await db.getConnection();

        try {
            const [questionHint] = await connection.execute(
                `
                SELECT fq.hints
                FROM fill_blank_questions fq
                JOIN fill_blank_sets fs
                    ON fq.set_id = fs.id
                WHERE fs.user_id = ?
                AND fs.id = ? AND fq.id = ?
                `, [userId, setId, questionId]
            );

            return questionHint[0];

        } catch (error) {
            console.error("Fail to get the hint of the particular question at FillInBlank due to: " + error);
            throw error;

        } finally {
            connection.release();
        }
    },

    async setHintOnQuestion({ setId, questionId, userId }) {
        const connection = await db.getConnection();

        try {
            const [result] = await connection.execute(
                `
                UPDATE fill_blank_questions fq
                JOIN fill_blank_sets fs
                    ON fq.set_id = fs.id
                SET fq.has_hint = TRUE
                WHERE fs.user_id = ?
                AND fs.id = ? AND fq.id = ?
                `, [userId, setId, questionId]
            );

            //Already hinted, or not this user's question
            if (result.affectedRows === 0) {
                return false;
            }

            await connection.execute(
                `
                UPDATE unlocked_features uf
                SET uf.num_unlock = uf.num_unlock - 1
                WHERE uf.specific_type = 'hint' AND uf.user_id = ? AND uf.num_unlock > 0
                `, [userId]
            );

            return true;

        } catch (error) {
            console.error("Fail to set the hint on this particular question at FillInBlank due to: " + error);
            throw error;

        } finally {
            connection.release();
        }
    },

    async getShieldByQuestionId({ setId, questionId, userId }) {
        const connection = await db.getConnection();

        try {
            const [currentQuestionShield] = await connection.execute(
                `
                SELECT fq.has_protected
                FROM fill_blank_questions fq
                JOIN fill_blank_sets fs
                    ON fq.set_id = fs.id
                WHERE fs.user_id = ?
                AND fs.id = ? AND fq.id = ?
                `, [userId, setId, questionId]
            );

            return currentQuestionShield[0];

        } catch (error) {
            console.error("Fail to get the protective shield on this particular question at FillInBlank due to: " + error);
            throw error;

        } finally {
            connection.release();
        }
    },

    async setShieldOnQuestion({ setId, questionId, userId }) {
        const connection = await db.getConnection();

        try {
            const [result] = await connection.execute(
                `
                UPDATE fill_blank_questions fq
                JOIN fill_blank_sets fs
                    ON fq.set_id = fs.id
                SET fq.has_protected = TRUE
                WHERE fs.user_id = ?
                AND fs.id = ? AND fq.id = ?
                `, [userId, setId, questionId]
            );

            //Already protected, or not this user's question
            if (result.affectedRows === 0) {
                return false;
            }

            await connection.execute(
                `
                UPDATE unlocked_features uf
                SET uf.num_unlock = uf.num_unlock - 1
                WHERE uf.specific_type = 'block' AND uf.user_id = ? AND uf.num_unlock > 0
                `, [userId]
            );

            return true;

        } catch (error) {
            console.error("Fail to apply shield on the particular question at FillInBlank due to: " + error);
            throw error;

        } finally {
            connection.release();
        }
    },

    async saveAnswer({ setId, questionId, blankOrder, selectedWord, isCorrect }) {
        await db.execute(
            `INSERT INTO fill_blank_user_answers (set_id, question_id, blank_order, selected_word, is_correct)
            VALUES (?, ?, ?, ?, ?)`,
            [setId, questionId, blankOrder, selectedWord, isCorrect]
        );
    },

    async submitSet({ setId, score, completedAt }) {
        await db.execute(
            `
            UPDATE fill_blank_sets
            SET score = ?, completed_at = ?
            WHERE id = ?
            `,
            [score, completedAt, setId]
        );

        return true;
    },

    async getSetResults({ setId, userId }) {
        const [sets] = await db.execute(
            `
            SELECT fs.*, d.title as document_title
            FROM fill_blank_sets fs
            JOIN documents d
                ON fs.document_id = d.id
            WHERE fs.id = ?
                AND fs.user_id = ?
            LIMIT 1
            `,
            [setId, userId]
        );

        if (sets.length === 0) {
            return null;
        }

        const set = sets[0];
        const [questions] = await db.execute(
            `SELECT * FROM fill_blank_questions WHERE set_id = ?`,
            [setId]
        );

        for (const question of questions) {
            const [words] = await db.execute(
                `
                SELECT word_text, correct_blank_order
                FROM fill_blank_words
                WHERE question_id = ? AND correct_blank_order IS NOT NULL
                ORDER BY correct_blank_order ASC
                `,
                [question.id]
            );

            question.correctWords = words.map(w => w.word_text);
        }

        set.questions = questions.map(q => ({
            id: q.id,
            questionText: q.question_text,
            numBlanks: q.num_blanks,
            correctWords: q.correctWords,
            explanation: q.explanation,
            topic: q.topic,
            num_xp: q.num_xp
        }));

        const [userAnswers] = await db.execute(
            `
            SELECT *
            FROM fill_blank_user_answers
            WHERE set_id = ?
            `, [setId]
        );

        set.user_answers = userAnswers;

        return set;
    },

    async deleteSet({ setId, userId }) {
        const [set] = await db.execute(
            `
            SELECT *
            FROM fill_blank_sets
            WHERE id = ?
            AND user_id = ?
            `,
            [setId, userId]
        );

        if (set.length === 0) {
            return false;
        }

        await db.execute(
            `DELETE FROM fill_blank_user_answers
            WHERE set_id = ?`,
            [setId]
        );

        await db.execute(
            `
            DELETE fw
            FROM fill_blank_words fw
            JOIN fill_blank_questions fq
                ON fw.question_id = fq.id
            WHERE fq.set_id = ?
            `,
            [setId]
        );

        await db.execute(
            `
            DELETE FROM fill_blank_questions
            WHERE set_id = ?
            `,
            [setId]
        );

        await db.execute(
            `
            DELETE FROM fill_blank_sets
            WHERE id = ?
            `, [setId]
        );

        return true;
    }
}

export default FillInBlank;
