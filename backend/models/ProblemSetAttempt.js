import db from '../config/MySQL.js';
import { maskBlanks } from '../utils/ProblemSetBlanks.js';

const ProblemSetAttempt = {
    async getByUser(problemSetId, userId) {
        const [rows] = await db.execute(
            `SELECT * FROM problem_set_attempts WHERE problem_set_id = ? AND user_id = ?`,
            [problemSetId, userId]
        );
        return rows[0];
    },

    //Every published set's questions/options, WITHOUT is_correct — safe to send before the student submits.
    //A fill-in-the-blank's answers are also removed, from both the passage and its options.
    async getQuestionsForAttempt(problemSetId) {
        const [questions] = await db.execute(
            `SELECT id, position, type, title, description FROM problem_set_questions
             WHERE problem_set_id = ? ORDER BY position ASC`, [problemSetId]
        );
        if (questions.length === 0) return [];

        const placeholders = questions.map(() => '?').join(', ');
        const [options] = await db.execute(
            `SELECT id, question_id, position, option_text FROM problem_set_options
             WHERE question_id IN (${placeholders}) ORDER BY position ASC`, questions.map((q) => q.id)
        );

        return questions.map((q) => {
            const questionOptions = options.filter((o) => o.question_id === q.id);
            return q.type === 'fill_blank'
                ? { ...q, description: maskBlanks(q.description), options: questionOptions.map(({ id, position }) => ({ id, position })) }
                : { ...q, options: questionOptions };
        });
    },

    //Grades and stores one attempt in a transaction. answers = [{ questionId, optionId }].
    //Returns { attemptId, score, totalPoints } or 'already_attempted' if this student already submitted this set.
    async submit(problemSetId, userId, answers) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const [existing] = await connection.execute(
                `SELECT id FROM problem_set_attempts WHERE problem_set_id = ? AND user_id = ? FOR UPDATE`,
                [problemSetId, userId]
            );
            if (existing[0]) {
                await connection.rollback();
                return 'already_attempted';
            }

            const [questions] = await connection.execute(
                `SELECT id, points FROM problem_set_questions WHERE problem_set_id = ?`, [problemSetId]
            );

            let options = [];
            if (questions.length > 0) {
                const placeholders = questions.map(() => '?').join(', ');
                [options] = await connection.execute(
                    `SELECT id, question_id, is_correct FROM problem_set_options WHERE question_id IN (${placeholders})`,
                    questions.map((q) => q.id)
                );
            }

            const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);
            let score = 0;
            const answerRows = [];

            for (const q of questions) {
                //Only trust an option id that is actually an answer to this exact question.
                const picked = answers.find((a) => a.questionId === q.id);
                const chosenOption = picked ? options.find((o) => o.id === picked.optionId && o.question_id === q.id) : null;
                const isCorrect = !!chosenOption?.is_correct;
                if (isCorrect) score += q.points || 0;

                answerRows.push([q.id, chosenOption?.id ?? null, isCorrect]);
            }

            const [attemptResult] = await connection.execute(
                `INSERT INTO problem_set_attempts (problem_set_id, user_id, score, total_points, submitted_at)
                 VALUES (?, ?, ?, ?, ?)`,
                [problemSetId, userId, score, totalPoints, new Date()]
            );
            const attemptId = attemptResult.insertId;

            if (answerRows.length > 0) {
                const placeholders = answerRows.map(() => '(?, ?, ?, ?)').join(', ');
                const params = answerRows.flatMap(([questionId, optionId, isCorrect]) => [attemptId, questionId, optionId, isCorrect]);
                await connection.execute(
                    `INSERT INTO problem_set_attempt_answers (attempt_id, question_id, selected_option_id, is_correct) VALUES ${placeholders}`,
                    params
                );
            }

            await connection.commit();
            return { attemptId, score, totalPoints };

        } catch (error) {
            await connection.rollback();
            throw error;

        } finally {
            connection.release();
        }
    },

    //Full breakdown for the result page: every question, what the student picked, and what was correct.
    async getResult(attemptId, userId) {
        const [rows] = await db.execute(
            `SELECT * FROM problem_set_attempts WHERE id = ? AND user_id = ?`, [attemptId, userId]
        );
        const attempt = rows[0];
        if (!attempt) return null;

        const [questions] = await db.execute(
            `SELECT id, position, title, description, points FROM problem_set_questions
             WHERE problem_set_id = ? ORDER BY position ASC`, [attempt.problem_set_id]
        );

        let options = [];
        if (questions.length > 0) {
            const placeholders = questions.map(() => '?').join(', ');
            [options] = await db.execute(
                `SELECT id, question_id, option_text, is_correct FROM problem_set_options
                 WHERE question_id IN (${placeholders}) ORDER BY position ASC`, questions.map((q) => q.id)
            );
        }

        const [answers] = await db.execute(
            `SELECT question_id, selected_option_id, is_correct FROM problem_set_attempt_answers WHERE attempt_id = ?`,
            [attemptId]
        );

        const breakdown = questions.map((q) => {
            const answer = answers.find((a) => a.question_id === q.id);
            return {
                ...q,
                options: options.filter((o) => o.question_id === q.id),
                selectedOptionId: answer?.selected_option_id ?? null,
                isCorrect: !!answer?.is_correct
            };
        });

        return { attempt, breakdown };
    },

    //One row per student who attempted, for every problem set in the class — used to show the caller's own
    //attempt (score) next to each set on the list page.
    async getAttemptsForUserByClass(classId, userId) {
        const [rows] = await db.execute(
            `SELECT a.problem_set_id, a.score, a.total_points FROM problem_set_attempts a
             JOIN problem_sets p ON p.id = a.problem_set_id
             WHERE p.class_id = ? AND a.user_id = ?`, [classId, userId]
        );
        return rows;
    }
};

export default ProblemSetAttempt;
