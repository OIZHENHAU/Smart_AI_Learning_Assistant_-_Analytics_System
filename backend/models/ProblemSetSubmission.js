import db from '../config/MySQL.js';
import ProblemSetComment from './ProblemSetComment.js';
import { maskBlanks } from '../utils/ProblemSetBlanks.js';
import { gradeFillBlank, normaliseAnswer, roundPoints } from '../utils/ProblemSetGrading.js';

const inPlaceholders = (ids) => ids.map(() => '?').join(', ');
//mysql2 returns DECIMAL columns as strings.
const toNumber = (value) => (value == null ? null : Number(value));

const ProblemSetSubmission = {
    //Submitted attempts in a class, newest first. userId limits it to one student's own.
    async listForClass(classId, { assessment, name, startDate, endDate, userId } = {}) {
        let query = `SELECT a.id, a.problem_set_id, p.title AS assessment, a.user_id, u.username AS student_name,
                            a.score, a.total_points, a.status, a.submitted_at, a.graded_at, d.saved_at AS draft_saved_at
                     FROM problem_set_attempts a
                     JOIN problem_sets p ON p.id = a.problem_set_id
                     JOIN users u ON u.id = a.user_id
                     LEFT JOIN problem_set_grading_drafts d ON d.attempt_id = a.id
                     WHERE p.class_id = ?`;
        const params = [classId];

        if (userId) { query += ` AND a.user_id = ?`; params.push(userId); }
        if (assessment && assessment.trim()) { query += ` AND p.title LIKE ?`; params.push(`%${assessment.trim()}%`); }
        if (name && name.trim()) { query += ` AND u.username LIKE ?`; params.push(`%${name.trim()}%`); }
        if (startDate) { query += ` AND DATE(a.submitted_at) >= ?`; params.push(startDate); }
        if (endDate) { query += ` AND DATE(a.submitted_at) <= ?`; params.push(endDate); }

        const [rows] = await db.execute(`${query} ORDER BY a.submitted_at DESC`, params);
        return rows.map((row) => ({ ...row, score: toNumber(row.score) }));
    },

    async getAttempt(attemptId) {
        const [rows] = await db.execute(
            `SELECT a.*, p.class_id, p.title AS assessment, u.username AS student_name, g.username AS grader_name
             FROM problem_set_attempts a
             JOIN problem_sets p ON p.id = a.problem_set_id
             JOIN users u ON u.id = a.user_id
             LEFT JOIN users g ON g.id = a.graded_by
             WHERE a.id = ?`, [attemptId]
        );
        return rows[0];
    },

    //Everything the grading page shows for one attempt, question by question, including the correct answers,
    //the suggested (auto) mark, the saved mark, and this student's conversation on each question.
    async getGradingDetail(attempt) {
        const [questions] = await db.execute(
            `SELECT id, position, type, title, description, points FROM problem_set_questions
             WHERE problem_set_id = ? ORDER BY position ASC`, [attempt.problem_set_id]
        );
        if (questions.length === 0) return [];

        const ids = questions.map((q) => q.id);
        const [options] = await db.execute(
            `SELECT id, question_id, position, option_text, is_correct FROM problem_set_options
             WHERE question_id IN (${inPlaceholders(ids)}) ORDER BY position ASC`, ids
        );
        const [questionFiles] = await db.execute(
            `SELECT id, question_id, original_name, file_name, file_size FROM problem_set_question_files
             WHERE question_id IN (${inPlaceholders(ids)}) ORDER BY id ASC`, ids
        );
        const [answers] = await db.execute(
            `SELECT id, question_id, selected_option_id, answer_text, blank_answers, is_correct, points_awarded
             FROM problem_set_attempt_answers WHERE attempt_id = ?`, [attempt.id]
        );

        let answerFiles = [];
        if (answers.length > 0) {
            const answerIds = answers.map((a) => a.id);
            [answerFiles] = await db.execute(
                `SELECT id, answer_id, original_name, file_name, file_size FROM problem_set_attempt_files
                 WHERE answer_id IN (${inPlaceholders(answerIds)}) ORDER BY id ASC`, answerIds
            );
        }

        const conversations = await Promise.all(questions.map((q) => ProblemSetComment.getConversations(q.id, attempt.user_id)));

        return questions.map((q, index) => {
            const answer = answers.find((a) => a.question_id === q.id);
            const questionOptions = options.filter((o) => o.question_id === q.id);
            const max = q.points || 0;
            const base = {
                id: q.id,
                position: q.position,
                type: q.type,
                title: q.title,
                points: max,
                questionFiles: questionFiles.filter((f) => f.question_id === q.id),
                messages: conversations[index].flatMap((thread) => [thread, ...thread.replies])
            };
            let detail;

            if (q.type === 'fill_blank') {
                const expected = questionOptions.filter((o) => o.is_correct).map((o) => o.option_text);
                let given = [];
                try { given = answer?.blank_answers ? JSON.parse(answer.blank_answers) : []; } catch { given = []; }
                const grade = gradeFillBlank(expected, given, max);
                const used = new Set(given.map(normaliseAnswer));
                detail = {
                    description: maskBlanks(q.description),
                    blanks: grade.blanks,
                    correctCount: grade.correctCount,
                    //Extra words from the word bank the student didn't use, shown crossed out.
                    unusedWords: questionOptions
                        .filter((o) => !o.is_correct && !used.has(normaliseAnswer(o.option_text)))
                        .map((o) => o.option_text),
                    autoPoints: grade.points
                };

            } else if (q.type === 'open_ended') {
                detail = {
                    description: q.description,
                    answerText: answer?.answer_text ?? null,
                    answerFiles: answer ? answerFiles.filter((f) => f.answer_id === answer.id) : [],
                    autoPoints: null
                };

            } else {
                const correct = questionOptions.some((o) => o.id === answer?.selected_option_id && o.is_correct);
                detail = {
                    description: q.description,
                    options: questionOptions.map((o) => ({ id: o.id, text: o.option_text, isCorrect: !!o.is_correct })),
                    selectedOptionId: answer?.selected_option_id ?? null,
                    isCorrect: correct,
                    autoPoints: correct ? max : 0
                };
            }

            //The saved mark wins; an older submission without one falls back to the suggested mark.
            const saved = toNumber(answer?.points_awarded);
            return { ...base, ...detail, pointsAwarded: saved ?? detail.autoPoints };
        });
    },

    //The lecturer's half-finished marking for one attempt, or null. marks/comments are keyed by question id.
    async getGradingDraft(attemptId) {
        const [rows] = await db.execute(
            `SELECT d.marks, d.comments, d.saved_at, u.username AS saved_by_name
             FROM problem_set_grading_drafts d LEFT JOIN users u ON u.id = d.saved_by
             WHERE d.attempt_id = ?`, [attemptId]
        );
        const draft = rows[0];
        if (!draft) return null;

        const parse = (json) => { try { return JSON.parse(json) || {}; } catch { return {}; } };
        return { marks: parse(draft.marks), comments: parse(draft.comments), savedAt: draft.saved_at, savedByName: draft.saved_by_name };
    },

    //Replaces the draft. Nothing the student can see changes: no status, score or comment is touched.
    async saveGradingDraft(attemptId, marks, comments, userId) {
        await db.execute(
            `INSERT INTO problem_set_grading_drafts (attempt_id, marks, comments, saved_by, saved_at) VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE marks = VALUES(marks), comments = VALUES(comments), saved_by = VALUES(saved_by), saved_at = VALUES(saved_at)`,
            [attemptId, JSON.stringify(marks), JSON.stringify(comments), userId, new Date()]
        );
    },

    //Saves every question's mark and the lecturer's new comments in one transaction, then marks the attempt graded.
    //marks = [{ questionId, points, max }]; comments = [{ questionId, content }].
    async saveGrade(attempt, marks, comments, graderId) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            for (const mark of marks) {
                const [result] = await connection.execute(
                    `UPDATE problem_set_attempt_answers SET points_awarded = ? WHERE attempt_id = ? AND question_id = ?`,
                    [mark.points, attempt.id, mark.questionId]
                );
                //A question added after the student submitted has no answer row yet.
                if (result.affectedRows === 0) {
                    await connection.execute(
                        `INSERT INTO problem_set_attempt_answers (attempt_id, question_id, is_correct, points_awarded) VALUES (?, ?, FALSE, ?)`,
                        [attempt.id, mark.questionId, mark.points]
                    );
                }
            }

            const score = roundPoints(marks.reduce((sum, m) => sum + m.points, 0));
            const totalPoints = marks.reduce((sum, m) => sum + m.max, 0);
            await connection.execute(
                `UPDATE problem_set_attempts SET score = ?, total_points = ?, status = 'graded', graded_at = ?, graded_by = ? WHERE id = ?`,
                [score, totalPoints, new Date(), graderId, attempt.id]
            );

            //Each comment joins this student's conversation on that question, or starts it.
            for (const comment of comments) {
                const [[thread]] = await connection.execute(
                    `SELECT id FROM problem_set_question_comments
                     WHERE question_id = ? AND parent_id IS NULL AND COALESCE(student_id, author_id) = ? ORDER BY id ASC LIMIT 1`,
                    [comment.questionId, attempt.user_id]
                );
                await connection.execute(
                    `INSERT INTO problem_set_question_comments (question_id, parent_id, student_id, author_id, content, created_at)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [comment.questionId, thread?.id ?? null, thread ? null : attempt.user_id, graderId, comment.content, new Date()]
                );
            }

            //The marking is final now, so the half-finished copy goes.
            await connection.execute(`DELETE FROM problem_set_grading_drafts WHERE attempt_id = ?`, [attempt.id]);

            await connection.commit();
            return { score, totalPoints };

        } catch (error) {
            await connection.rollback();
            throw error;

        } finally {
            connection.release();
        }
    }
};

export default ProblemSetSubmission;
