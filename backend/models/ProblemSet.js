import db from '../config/MySQL.js';

const SELECT_SET = `SELECT p.id, p.class_id, p.author_id, u.username AS author_name, p.title, p.status,
                            p.created_at, p.published_at
                    FROM problem_sets p JOIN users u ON u.id = p.author_id`;

const ProblemSet = {
    async createDraft({ classId, authorId, title }) {
        const [result] = await db.execute(
            `INSERT INTO problem_sets (class_id, author_id, title, status, created_at) VALUES (?, ?, ?, 'draft', ?)`,
            [classId, authorId, title, new Date()]
        );
        return result.insertId;
    },

    //Staff see every set, students only the published ones.
    async getAllForClass(classId, { includeDrafts }) {
        let query = `${SELECT_SET} WHERE p.class_id = ?`;
        const params = [classId];

        if (!includeDrafts) {
            query += ` AND p.status = 'published'`;
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

    //Every question with its options, in position order.
    async getQuestions(setId) {
        const [questions] = await db.execute(
            `SELECT id, position, title, description, points FROM problem_set_questions
             WHERE problem_set_id = ? ORDER BY position ASC`, [setId]
        );
        if (questions.length === 0) return [];

        //execute() (prepared statements) does not expand an array into IN (?) the way query() does,
        //so the placeholders are built out by hand here, one per question id.
        const placeholders = questions.map(() => '?').join(', ');
        const [options] = await db.execute(
            `SELECT id, question_id, position, option_text, is_correct FROM problem_set_options
             WHERE question_id IN (${placeholders}) ORDER BY position ASC`, questions.map((q) => q.id)
        );

        return questions.map((q) => ({
            ...q,
            options: options.filter((o) => o.question_id === q.id).map((o) => ({ ...o, is_correct: !!o.is_correct }))
        }));
    },

    async getQuestionById(questionId) {
        const [rows] = await db.execute(
            `SELECT id, problem_set_id, position, title, description, points FROM problem_set_questions WHERE id = ?`,
            [questionId]
        );
        return rows[0];
    },

    async addQuestion(setId) {
        const [[{ nextPosition }]] = await db.execute(
            `SELECT COALESCE(MAX(position), 0) + 1 AS nextPosition FROM problem_set_questions WHERE problem_set_id = ?`,
            [setId]
        );
        const [result] = await db.execute(
            `INSERT INTO problem_set_questions (problem_set_id, position, title, description) VALUES (?, ?, ?, '')`,
            [setId, nextPosition, 'Multiple Choice Question']
        );
        return result.insertId;
    },

    //Replaces the question's fields and its whole option list in one transaction.
    async updateQuestion(questionId, { title, description, points, options }) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            await connection.execute(
                `UPDATE problem_set_questions SET title = ?, description = ?, points = ? WHERE id = ?`,
                [title, description, points, questionId]
            );
            await connection.execute(`DELETE FROM problem_set_options WHERE question_id = ?`, [questionId]);

            if (options.length > 0) {
                const placeholders = options.map(() => '(?, ?, ?, ?)').join(', ');
                const params = options.flatMap((opt, index) => [questionId, index + 1, opt.text, !!opt.isCorrect]);
                await connection.execute(
                    `INSERT INTO problem_set_options (question_id, position, option_text, is_correct) VALUES ${placeholders}`,
                    params
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
