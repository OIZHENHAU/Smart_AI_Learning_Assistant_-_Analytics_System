import db from '../config/MySQL.js';

const Quiz = {
    async createQuiz({userId, documentId, title, questions}) {
        //Insert Quiz
        const [quizResult] = await db.execute(
            `INSERT INTO quizzes (user_id, document_id, title, total_questions)
             VALUES (?, ?, ?, ?)`,
             [userId, documentId, title, questions.length]
        );

        const quizId = quizResult.insertId;

        //Insert Questions
        for (const q of questions) {
            const [questionResult] = await db.execute(
                `INSERT INTO questions (quiz_id, question, correct_answer, explanation, difficulty, topic)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [quizId, q.question, q.correctAnswer, q.explanation || null, q.difficulty || 'medium', q.topic || null]
            );

            const questionId = questionResult.insertId;

            //Insert option into quiz
            for (const opt of q.options) {
                await db.execute(
                    `INSERT INTO options (question_id, option_text)
                    VALUES (?, ?)`,
                    [questionId, opt]
                );
            }
        }
        return quizId;
    },

    async getQuizById({quizId, userId}) {
        const [quiz] = await db.execute(
            `SELECT * FROM quizzes WHERE id = ?`,
            [quizId]
        );

        const [questions] = await db.execute(
            `SELECT * FROM questions WHERE quiz_id = ?`,
            [quizId]
        );

        for (let q of questions) {
            const [options] = await db.execute(
                `SELECT option_text FROM options WHERE question_id = ?`,
                [q.id]
            );
            q.options = options.map(o => o.option_text);
        }

        return {
            ...quiz[0],
            questions: questions.map(q => ({
                id: q.id,
                question: q.question,
                options: q.options,
                correct_answer: q.correct_answer,
                explanation: q.explanation,
                difficulty: q.difficulty,
                topic: q.topic
            }))
        };
    },

    async saveAnswer({quizId, questionId, selectedAnswer, isCorrect}) {
        await db.execute(
            `INSERT INTO user_answers (quiz_id, question_id, selected_answer, is_correct)
            VALUES (?, ?, ?, ?)`,
            [quizId, questionId, selectedAnswer, isCorrect]
        );
    },

    async countDocumentQuiz(documentId, userId) {
        const [rows] = await db.execute(`
            SELECT COUNT(*) AS total
            FROM quizzes
            WHERE document_id = ? AND user_id = ?`,
            [documentId, userId]
        );

        return rows[0].total;
    },

    async getQuizzesByDocument({userId, documentId}) {
        const [quizzes] = await db.execute(
            `
            SELECT q.id, q.title, q.score, q.total_questions, q.completed_at, q.created_at,
            d.title AS document_title, d.file_name
            FROM quizzes q
            JOIN documents d
                ON q.document_id = d.id
            WHERE q.user_id = ?
            AND q.document_id = ?
            ORDER BY q.created_at DESC
            `,
            [userId, documentId]
        );

        //Get questions with options for each quiz
        for (const quiz of quizzes) {
            //Gret questions
            const [questions] = await db.execute(
                `
                SELECT *
                FROM questions 
                WHERE quiz_id = ?
                `, [quiz.id]
            );

            //Get options for every questions
            for (const question of questions) {
                const [options] = await db.execute(
                    `
                    SELECT option_text
                    FROM options
                    WHERE question_id = ?
                    `, [question.id]
                );

                question.options = options.map(o => o.option_text);
            }

            //Attach questions to quiz
            quiz.questions = questions.map(q => ({
                id: q.id,
                question: q.question,
                options: q.options,
                correctAnswer: q.correct_answer,
                explanation: q.explanation,
                difficulty: q.difficulty,
                topic: q.topic
            }));
        }

        return quizzes;
    },

    async submitQuiz({ quizId, score, completedAt }) {
        await db.execute(
            `
            UPDATE quizzes
            SET score = ?, completed_at = ?
            WHERE id = ?
            `,
            [score, completedAt, quizId]
        );

        return true;
    },

    async getQuizResults({ quizId, userId }) {
        //Get quiz
        const [quizzes] = await db.execute(
            `
            SELECT q.*, d.title as document_title
            FROM quizzes q
            JOIN documents d
                ON q.document_id = d.id
            WHERE q.id = ?
                AND q.user_id = ?
            LIMIT 1
            `,
            [quizId, userId]
        );

        if (quizzes.length === 0) {
            return null;
        }

        const quiz = quizzes[0];
        const [questions] = await db.execute(
            `
            SELECT * FROM questions
            WHERE quiz_id = ? 
            `,
            [quizId]
        );

        //Get options
        for (const question of questions) {
            const [options] = await db.execute(
                `
                SELECT option_text
                FROM options
                WHERE question_id = ?
                `,
                [question.id]
            );

            question.options = options.map(o => o.option_text);
        }

        //Build questions array
        quiz.questions = questions.map(q => ({
            id: q.id,
            question: q.question,
            options: q.options,
            correct_answer: q.correct_answer,
            explanation: q.explanation,
            topic: q.topic
        }));

        //Get user answers
        const [userAnswers] = await db.execute(
            `
             SELECT *
             FROM user_answers
             WHERE quiz_id = ?
            `, [quizId]
        );

        quiz.user_answers = userAnswers;

        return quiz;
    },

    async deleteQuiz({quizId, userId}) {
        //Check the quiz if it exist
        const [quiz] = await db.execute(
            `
            SELECT * 
            FROM quizzes
            WHERE id = ?
            AND user_id = ?
            `,
            [quizId, userId]
        );

        if (quiz.length === 0) {
            return false;
        }

        //Delete user's answers
        await db.execute(
            `DELETE FROM user_answers
            WHERE quiz_id = ?`,
            [quizId]
        );

        //Delete options
        await db.execute(
            `
            DELETE opt
            FROM options opt
            JOIN questions q
                ON opt.question_id = q.id
            WHERE q.quiz_id = ?
            `,
            [quizId]
        );

        //Delete questions
        await db.execute(
            `
            DELETE FROM questions
            WHERE quiz_id = ?
            `,
            [quizId]
        );

        //Delte quiz
        await db.execute(
            `
            DELETE FROM quizzes
            WHERE id = ?
            `, [quizId]
        );

        return true;
    }
}

export default Quiz;