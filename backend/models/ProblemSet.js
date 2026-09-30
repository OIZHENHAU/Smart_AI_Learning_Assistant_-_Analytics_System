import db from '../config/MySQL.js';

const SELECT_SET = `SELECT p.id, p.class_id, p.author_id, u.username AS author_name, p.title, p.status,
                            p.created_at, p.published_at
                    FROM problem_sets p JOIN users u ON u.id = p.author_id`;

//Same shape as SELECT_SET, plus each set's total points (the sum of its questions' points) and the achievement
//it's needed for (badge icon + expiry date), for the list page.
const SELECT_SET_WITH_POINTS = `SELECT p.id, p.class_id, p.author_id, u.username AS author_name, p.title, p.status,
                                        p.created_at, p.published_at,
                                        (SELECT COALESCE(SUM(q.points), 0) FROM problem_set_questions q
                                         WHERE q.problem_set_id = p.id) AS total_points,
                                        a.badge_image AS achievement_badge, a.title AS achievement_title,
                                        a.expiry_date AS achievement_expiry
                                FROM problem_sets p JOIN users u ON u.id = p.author_id
                                LEFT JOIN problem_set_achievements a ON a.problem_set_id = p.id`;

//Default title for each question type; the lecturer can rename it in the question card's header.
//Must match the titles in the frontend's questionTypes.js.
const DEFAULT_TITLES = {
    mcq: 'Multiple Choice Question',
    fill_blank: 'Fill in the Blank',
    open_ended: 'Open-Ended Question'
};

const ProblemSet = {
    async createDraft({ classId, authorId, title }) {
        const [result] = await db.execute(
            `INSERT INTO problem_sets (class_id, author_id, title, status, created_at) VALUES (?, ?, ?, 'draft', ?)`,
            [classId, authorId, title, new Date()]
        );
        return result.insertId;
    },

    //Staff see every set, students only the published ones. title/startDate/endDate filter like every other list page.
    async getAllForClass(classId, { includeDrafts, title, startDate, endDate } = {}) {
        let query = `${SELECT_SET_WITH_POINTS} WHERE p.class_id = ?`;
        const params = [classId];

        if (!includeDrafts) {
            query += ` AND p.status = 'published'`;
        }
        if (title && title.trim()) {
            query += ` AND p.title LIKE ?`;
            params.push(`%${title.trim()}%`);
        }
        if (startDate) {
            query += ` AND DATE(p.created_at) >= ?`;
            params.push(startDate);
        }
        if (endDate) {
            query += ` AND DATE(p.created_at) <= ?`;
            params.push(endDate);
        }

        const [rows] = await db.execute(`${query} ORDER BY p.created_at DESC`, params);
        return rows;
    },

    async getById(setId) {
        const [rows] = await db.execute(`${SELECT_SET} WHERE p.id = ?`, [setId]);
        return rows[0];
    },

    async updateTitle(setId, title) {
        await db.execute(`UPDATE problem_sets SET title = ? WHERE id = ?`, [title, setId]);
    },

    async publish(setId) {
        await db.execute(`UPDATE problem_sets SET status = 'published', published_at = ? WHERE id = ?`, [new Date(), setId]);
    },

    async deleteSet(setId) {
        await db.execute(`DELETE FROM problem_sets WHERE id = ?`, [setId]); //questions/options/achievement cascade
    },

    //Every question with its options and attached files, in position order.
    async getQuestions(setId) {
        const [questions] = await db.execute(
            `SELECT id, position, type, title, description, points FROM problem_set_questions
             WHERE problem_set_id = ? ORDER BY position ASC`, [setId]
        );
        if (questions.length === 0) return [];

        //execute() (prepared statements) does not expand an array into IN (?) the way query() does,
        //so the placeholders are built out by hand here, one per question id.
        const placeholders = questions.map(() => '?').join(', ');
        const questionIds = questions.map((q) => q.id);
        const [options] = await db.execute(
            `SELECT id, question_id, position, option_text, is_correct FROM problem_set_options
             WHERE question_id IN (${placeholders}) ORDER BY position ASC`, questionIds
        );
        const [files] = await db.execute(
            `SELECT id, question_id, original_name, file_name, file_size FROM problem_set_question_files
             WHERE question_id IN (${placeholders}) ORDER BY id ASC`, questionIds
        );

        return questions.map((q) => ({
            ...q,
            options: options.filter((o) => o.question_id === q.id).map((o) => ({ ...o, is_correct: !!o.is_correct })),
            files: files.filter((f) => f.question_id === q.id)
        }));
    },

    async getQuestionById(questionId) {
        const [rows] = await db.execute(
            `SELECT id, problem_set_id, position, type, title, description, points FROM problem_set_questions WHERE id = ?`,
            [questionId]
        );
        return rows[0];
    },

    async addQuestion(setId, type = 'mcq') {
        const [[{ nextPosition }]] = await db.execute(
            `SELECT COALESCE(MAX(position), 0) + 1 AS nextPosition FROM problem_set_questions WHERE problem_set_id = ?`,
            [setId]
        );
        const [result] = await db.execute(
            `INSERT INTO problem_set_questions (problem_set_id, position, type, title, description) VALUES (?, ?, ?, ?, '')`,
            [setId, nextPosition, type, DEFAULT_TITLES[type]]
        );
        return result.insertId;
    },

    //Saves the question's fields and its option list in one transaction.
    async updateQuestion(questionId, { type, title, description, points, options }) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            await connection.execute(
                `UPDATE problem_set_questions SET type = ?, title = ?, description = ?, points = ? WHERE id = ?`,
                [type, title, description, points, questionId]
            );

            //Options that still exist keep their row (and id), so students' submitted answers that point at them stay
            //linked. Only options the lecturer removed are deleted. An id is only trusted if it belongs to this question.
            const [existingRows] = await connection.execute(`SELECT id FROM problem_set_options WHERE question_id = ?`, [questionId]);
            const existingIds = new Set(existingRows.map((row) => row.id));
            const reused = new Set();
            const toUpdate = [];
            const toInsert = [];
            options.forEach((opt, index) => {
                const row = { ...opt, position: index + 1 };
                if (opt.id != null && existingIds.has(opt.id) && !reused.has(opt.id)) {
                    reused.add(opt.id);
                    toUpdate.push(row);
                } else {
                    toInsert.push(row);
                }
            });

            const removedIds = [...existingIds].filter((id) => !reused.has(id));
            if (removedIds.length > 0) {
                await connection.execute(
                    `DELETE FROM problem_set_options WHERE id IN (${removedIds.map(() => '?').join(', ')})`, removedIds
                );
            }
            for (const opt of toUpdate) {
                await connection.execute(
                    `UPDATE problem_set_options SET position = ?, option_text = ?, is_correct = ? WHERE id = ?`,
                    [opt.position, opt.text, !!opt.isCorrect, opt.id]
                );
            }
            for (const opt of toInsert) {
                await connection.execute(
                    `INSERT INTO problem_set_options (question_id, position, option_text, is_correct) VALUES (?, ?, ?, ?)`,
                    [questionId, opt.position, opt.text, !!opt.isCorrect]
                );
            }

            await connection.commit();

        } catch (error) {
            await connection.rollback();
            throw error;

        } finally {
            connection.release();
        }
    },

    //Returns false when the question wasn't in this set. Closes the position gap so 1..N stays contiguous.
    async deleteQuestion(setId, questionId) {
        const [rows] = await db.execute(
            `SELECT position FROM problem_set_questions WHERE id = ? AND problem_set_id = ?`, [questionId, setId]
        );
        if (!rows[0]) return false;

        await db.execute(`DELETE FROM problem_set_questions WHERE id = ?`, [questionId]); //options cascade
        await db.execute(
            `UPDATE problem_set_questions SET position = position - 1 WHERE problem_set_id = ? AND position > ?`,
            [setId, rows[0].position]
        );
        return true;
    },

    async getQuestionFile(fileId) {
        const [rows] = await db.execute(`SELECT * FROM problem_set_question_files WHERE id = ?`, [fileId]);
        return rows[0];
    },

    async addQuestionFile(questionId, { originalName, fileName, fileSize }) {
        const [result] = await db.execute(
            `INSERT INTO problem_set_question_files (question_id, original_name, file_name, file_size, uploaded_at)
             VALUES (?, ?, ?, ?, ?)`,
            [questionId, originalName, fileName, fileSize, new Date()]
        );
        return { id: result.insertId, question_id: questionId, original_name: originalName, file_name: fileName, file_size: fileSize };
    },

    async deleteQuestionFile(fileId) {
        await db.execute(`DELETE FROM problem_set_question_files WHERE id = ?`, [fileId]);
    },

    //Removes every attachment row of one question (e.g. it stopped being open-ended) and returns the filenames
    //so the caller can delete the files from disk too.
    async deleteFilesForQuestion(questionId) {
        const fileNames = await this.getFileNamesByQuestion(questionId);
        await db.execute(`DELETE FROM problem_set_question_files WHERE question_id = ?`, [questionId]);
        return fileNames;
    },

    //The three below are read before a question/set/class is deleted, because the delete cascades the rows away
    //but not the files on disk.
    async getFileNamesByQuestion(questionId) {
        const [rows] = await db.execute(`SELECT file_name FROM problem_set_question_files WHERE question_id = ?`, [questionId]);
        return rows.map((row) => row.file_name);
    },

    async getFileNamesBySet(setId) {
        const [rows] = await db.execute(
            `SELECT f.file_name FROM problem_set_question_files f
             JOIN problem_set_questions q ON q.id = f.question_id WHERE q.problem_set_id = ?`, [setId]
        );
        return rows.map((row) => row.file_name);
    },

    async getFileNamesByClass(classId) {
        const [rows] = await db.execute(
            `SELECT f.file_name FROM problem_set_question_files f
             JOIN problem_set_questions q ON q.id = f.question_id
             JOIN problem_sets p ON p.id = q.problem_set_id WHERE p.class_id = ?`, [classId]
        );
        return rows.map((row) => row.file_name);
    },

    async getAchievement(setId) {
        const [rows] = await db.execute(`SELECT * FROM problem_set_achievements WHERE problem_set_id = ?`, [setId]);
        return rows[0];
    },

    //Creates a blank achievement row (every field NULL) the moment the achievement toggle is switched on, so
    //there is something in the database to autosave into right away. A no-op if the row already exists.
    async createDraftAchievement(setId) {
        await db.execute(
            `INSERT INTO problem_set_achievements (problem_set_id) VALUES (?)
             ON DUPLICATE KEY UPDATE problem_set_id = problem_set_id`,
            [setId]
        );
    },

    //Fields may be null; the row is meant to be filled in gradually, and is only required to be complete at publish.
    async upsertAchievement(setId, { badgeImage, title, description, minPoints, expiryDate }) {
        await db.execute(
            `INSERT INTO problem_set_achievements (problem_set_id, badge_image, title, description, min_points, expiry_date)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE badge_image = VALUES(badge_image), title = VALUES(title),
                description = VALUES(description), min_points = VALUES(min_points), expiry_date = VALUES(expiry_date)`,
            [setId, badgeImage, title, description, minPoints, expiryDate]
        );
    },

    //Returns the badge's filename so the caller can delete the file too, or undefined when there was none.
    async deleteAchievement(setId) {
        const [existing] = await db.execute(`SELECT badge_image FROM problem_set_achievements WHERE problem_set_id = ?`, [setId]);
        await db.execute(`DELETE FROM problem_set_achievements WHERE problem_set_id = ?`, [setId]);
        return existing[0]?.badge_image;
    },

    //Read before a class is deleted, because the delete cascades the rows away but not the badge files.
    async getBadgeFileNamesByClass(classId) {
        const [rows] = await db.execute(
            `SELECT a.badge_image FROM problem_set_achievements a
             JOIN problem_sets p ON p.id = a.problem_set_id WHERE p.class_id = ?`, [classId]
        );
        return rows.map((row) => row.badge_image);
    },

    //Is this uploaded description image still referenced by some other question? Images live in one shared folder,
    //so this checks across every problem set, not just one.
    async isImageUsed(filename, exceptQuestionId = 0) {
        const [rows] = await db.execute(
            `SELECT 1 FROM problem_set_questions WHERE id != ? AND description LIKE ? LIMIT 1`,
            [exceptQuestionId, `%/uploads/problem-set-descriptions/${filename}%`]
        );
        return rows.length > 0;
    },

    //Read before a class is deleted, so its questions' description images can be cleaned up from disk too.
    async getDescriptionsByClass(classId) {
        const [rows] = await db.execute(
            `SELECT q.description FROM problem_set_questions q
             JOIN problem_sets p ON p.id = q.problem_set_id WHERE p.class_id = ?`, [classId]
        );
        return rows.map((row) => row.description);
    }
};

export default ProblemSet;
