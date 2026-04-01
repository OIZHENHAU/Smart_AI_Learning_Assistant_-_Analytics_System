import db from '../config/MySQL.js';

const Quiz = {
    async createQuiz({userId, documentId, title, questions}) {
        //1.) Insert Quiz
        const [quizResult] = await db.execute(
            `INSERT INTO quizzes (user_id, document_id, title, total_questions)
             VALUES (?, ?, ?, ?)`,
             [userId, documentId, title, questions.length]
        );

        const quizId = quizResult.insertId;

        //2.) Insert Questions
        for (const q of questions) {
            const [questionResult] = await db.execute(
                `INSERT INTO questions (quiz_id, question, correct_answer, explanation, difficulty)
                VALUES (?, ?, ?, ?, ?)`,
                [quizId, q.question, q.correctAnswer, q.explanation || null, q.difficulty || 'medium']
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

    async getQuizById({quizId}) {
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
            ...quiz[0], questions
        };
    },

    async saveAnswer({quizId, questionId, selectedAnswer, isCorrect}) {
        await db.execute(
            `INSERT INTO user_answers (quiz_id, question_id, selected_answer, is_correct)
            VALUES (?, ?, ?, ?)`,
            [quizId, questionId, selectedAnswer, isCorrect]
        );
    }
}

export default Quiz;