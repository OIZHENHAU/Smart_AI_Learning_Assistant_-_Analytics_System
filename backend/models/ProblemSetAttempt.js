import db from '../config/MySQL.js';
import { maskBlanks } from '../utils/ProblemSetBlanks.js';

//Fisher-Yates, so the word bank never gives away the order of the blanks.
const shuffle = (items) => {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
};

//How a fill-in-the-blank answer is compared: case, surrounding spaces and repeated spaces don't matter.
const normalise = (text) => String(text ?? '').trim().replace(/\s+/g, ' ').toLowerCase();

//execute() (prepared statements) does not expand an array into IN (?), so one placeholder per id is built here.
const inPlaceholders = (ids) => ids.map(() => '?').join(', ');

const ProblemSetAttempt = {
    async getByUser(problemSetId, userId) {
        const [rows] = await db.execute(
            `SELECT * FROM problem_set_attempts WHERE problem_set_id = ? AND user_id = ?`,
            [problemSetId, userId]
        );
        return rows[0];
    },

    //Every question of a published set in the shape the student sees, WITHOUT any answer:
    //  mcq        -> options without is_correct
    //  fill_blank -> the passage with its blanks emptied, plus the blank words shuffled into a word bank
    //  open_ended -> the lecturer's attached files
    async getQuestionsForAttempt(problemSetId) {
        const [questions] = await db.execute(
            `SELECT id, position, type, title, description FROM problem_set_questions
             WHERE problem_set_id = ? ORDER BY position ASC`, [problemSetId]
        );
        if (questions.length === 0) return [];

        const ids = questions.map((q) => q.id);
        //is_correct is only read to count a fill-in-the-blank's blanks; it's never passed on to the student.
        const [options] = await db.execute(
            `SELECT id, question_id, position, option_text, is_correct FROM problem_set_options
             WHERE question_id IN (${inPlaceholders(ids)}) ORDER BY position ASC`, ids
        );
        const [files] = await db.execute(
            `SELECT id, question_id, original_name, file_name, file_size FROM problem_set_question_files
             WHERE question_id IN (${inPlaceholders(ids)}) ORDER BY id ASC`, ids
        );

        return questions.map((q) => {
            const questionOptions = options.filter((o) => o.question_id === q.id);

            if (q.type === 'fill_blank') {
                //The word bank mixes the blank answers with the lecturer's extra wrong words.
                return {
                    ...q,
                    description: maskBlanks(q.description),
                    blankCount: questionOptions.filter((o) => o.is_correct).length,
                    wordBank: shuffle(questionOptions.map((o) => o.option_text)),
                    options: []
                };
            }
            if (q.type === 'open_ended') {
                return { ...q, options: [], files: files.filter((f) => f.question_id === q.id) };
            }
            return { ...q, options: questionOptions.map(({ id, option_text }) => ({ id, option_text })) };
        });
    },

    //Grades and stores one attempt in a transaction.
    //answers = [{ questionId, optionId, blanks, text }]; only the field that fits the question's type is used.
    //filesByQuestion = { [questionId]: [{ originalName, fileName, fileSize }] }, open-ended questions only.
    //Returns { attemptId, score, totalPoints } or 'already_attempted' if this student already submitted this set.
    async submit(problemSetId, userId, answers, filesByQuestion = {}) {
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
                `SELECT id, type, points FROM problem_set_questions WHERE problem_set_id = ?`, [problemSetId]
            );

            let options = [];
            if (questions.length > 0) {
                const ids = questions.map((q) => q.id);
                [options] = await connection.execute(
                    `SELECT id, question_id, position, option_text, is_correct FROM problem_set_options
                     WHERE question_id IN (${inPlaceholders(ids)}) ORDER BY position ASC`, ids
                );
            }

            const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);
            let score = 0;
            const answerRows = [];

            for (const q of questions) {
                const picked = answers.find((a) => a.questionId === q.id);
                const row = { questionId: q.id, optionId: null, answerText: null, blankAnswers: null, isCorrect: false, files: [] };

                if (q.type === 'fill_blank') {
                    //Right only when every blank is right, in order. The extra wrong words are not blanks.
                    const expected = options.filter((o) => o.question_id === q.id && o.is_correct).map((o) => o.option_text);
                    const given = expected.map((_, i) => String(picked?.blanks?.[i] ?? '').trim().slice(0, 500));
                    row.blankAnswers = JSON.stringify(given);
                    row.isCorrect = expected.length > 0 && expected.every((text, i) => normalise(text) === normalise(given[i]));

                } else if (q.type === 'open_ended') {
                    //Marked by the lecturer later, so an open-ended answer never counts as correct automatically.
                    row.answerText = picked?.text || null;
                    row.files = filesByQuestion[q.id] || [];

                } else {
                    //Only trust an option id that is actually an answer to this exact question.
                    const chosen = picked ? options.find((o) => o.id === picked.optionId && o.question_id === q.id) : null;
                    row.optionId = chosen?.id ?? null;
                    row.isCorrect = !!chosen?.is_correct;
                }

                if (row.isCorrect) score += q.points || 0;
                answerRows.push(row);
            }

            const [attemptResult] = await connection.execute(
                `INSERT INTO problem_set_attempts (problem_set_id, user_id, score, total_points, submitted_at)
                 VALUES (?, ?, ?, ?, ?)`,
                [problemSetId, userId, score, totalPoints, new Date()]
            );
            const attemptId = attemptResult.insertId;

            //One insert per answer (not one bulk insert) so each open-ended answer's id is known for its files.
            for (const row of answerRows) {
                const [answerResult] = await connection.execute(
                    `INSERT INTO problem_set_attempt_answers
                        (attempt_id, question_id, selected_option_id, answer_text, blank_answers, is_correct)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [attemptId, row.questionId, row.optionId, row.answerText, row.blankAnswers, row.isCorrect]
                );
                for (const file of row.files) {
                    await connection.execute(
                        `INSERT INTO problem_set_attempt_files (answer_id, original_name, file_name, file_size) VALUES (?, ?, ?, ?)`,
                        [answerResult.insertId, file.originalName, file.fileName, file.fileSize]
                    );
                }
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

    //Full breakdown of one attempt: every question, what the student answered, and what was correct.
    //The controller decides which of these fields a student is allowed to see.
    async getResult(attemptId, userId) {
        const [rows] = await db.execute(
            `SELECT * FROM problem_set_attempts WHERE id = ? AND user_id = ?`, [attemptId, userId]
        );
        const attempt = rows[0];
        if (!attempt) return null;

        const [questions] = await db.execute(
            `SELECT id, position, type, title, description, points FROM problem_set_questions
             WHERE problem_set_id = ? ORDER BY position ASC`, [attempt.problem_set_id]
        );

        let options = [];
        let questionFiles = [];
        if (questions.length > 0) {
            const ids = questions.map((q) => q.id);
            [options] = await db.execute(
                `SELECT id, question_id, option_text, is_correct FROM problem_set_options
                 WHERE question_id IN (${inPlaceholders(ids)}) ORDER BY position ASC`, ids
            );
            [questionFiles] = await db.execute(
                `SELECT id, question_id, original_name, file_name, file_size FROM problem_set_question_files
                 WHERE question_id IN (${inPlaceholders(ids)}) ORDER BY id ASC`, ids
            );
        }

        const [answers] = await db.execute(
            `SELECT id, question_id, selected_option_id, answer_text, blank_answers, is_correct
             FROM problem_set_attempt_answers WHERE attempt_id = ?`, [attemptId]
        );

        let answerFiles = [];
        if (answers.length > 0) {
            const answerIds = answers.map((a) => a.id);
            [answerFiles] = await db.execute(
                `SELECT id, answer_id, original_name, file_name, file_size FROM problem_set_attempt_files
                 WHERE answer_id IN (${inPlaceholders(answerIds)}) ORDER BY id ASC`, answerIds
            );
        }

        const breakdown = questions.map((q) => {
            const answer = answers.find((a) => a.question_id === q.id);
            return {
                ...q,
                options: options.filter((o) => o.question_id === q.id),
                questionFiles: questionFiles.filter((f) => f.question_id === q.id),
                selectedOptionId: answer?.selected_option_id ?? null,
                answerText: answer?.answer_text ?? null,
                blankAnswers: answer?.blank_answers ? JSON.parse(answer.blank_answers) : [],
                answerFiles: answer ? answerFiles.filter((f) => f.answer_id === answer.id) : [],
                isCorrect: !!answer?.is_correct
            };
        });

        return { attempt, breakdown };
    },

    //One row per set the student attempted in the class, for the list page. Only when it was submitted is
    //passed on to students (results aren't released to them), but score stays here for staff-side features.
    async getAttemptsForUserByClass(classId, userId) {
        const [rows] = await db.execute(
            `SELECT a.problem_set_id, a.score, a.total_points, a.submitted_at FROM problem_set_attempts a
             JOIN problem_sets p ON p.id = a.problem_set_id
             WHERE p.class_id = ? AND a.user_id = ?`, [classId, userId]
        );
        return rows;
    },

    //The three below are read before a question/set/class is deleted, because the delete cascades the answer and
    //draft rows away but not the students' files on disk (submitted and saved-draft files alike).
    async getFileNamesByQuestion(questionId) {
        const [rows] = await db.execute(
            `SELECT f.file_name FROM problem_set_attempt_files f
             JOIN problem_set_attempt_answers ans ON ans.id = f.answer_id WHERE ans.question_id = ?
             UNION ALL
             SELECT d.file_name FROM problem_set_draft_files d WHERE d.question_id = ?`, [questionId, questionId]
        );
        return rows.map((row) => row.file_name);
    },

    async getFileNamesBySet(problemSetId) {
        const [rows] = await db.execute(
            `SELECT f.file_name FROM problem_set_attempt_files f
             JOIN problem_set_attempt_answers ans ON ans.id = f.answer_id
             JOIN problem_set_attempts a ON a.id = ans.attempt_id WHERE a.problem_set_id = ?
             UNION ALL
             SELECT d.file_name FROM problem_set_draft_files d
             JOIN problem_set_attempt_drafts dr ON dr.id = d.draft_id WHERE dr.problem_set_id = ?`, [problemSetId, problemSetId]
        );
        return rows.map((row) => row.file_name);
    },

    async getFileNamesByClass(classId) {
        const [rows] = await db.execute(
            `SELECT f.file_name FROM problem_set_attempt_files f
             JOIN problem_set_attempt_answers ans ON ans.id = f.answer_id
             JOIN problem_set_attempts a ON a.id = ans.attempt_id
             JOIN problem_sets p ON p.id = a.problem_set_id WHERE p.class_id = ?
             UNION ALL
             SELECT d.file_name FROM problem_set_draft_files d
             JOIN problem_set_attempt_drafts dr ON dr.id = d.draft_id
             JOIN problem_sets p ON p.id = dr.problem_set_id WHERE p.class_id = ?`, [classId, classId]
        );
        return rows.map((row) => row.file_name);
    }
};

export default ProblemSetAttempt;
