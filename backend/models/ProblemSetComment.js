import db from '../config/MySQL.js';

const SELECT_COMMENT = `SELECT c.id, c.question_id, c.parent_id, c.author_id, u.username AS author_name,
                               c.content, c.created_at, c.updated_at
                        FROM problem_set_question_comments c
                        JOIN users u ON u.id = c.author_id`;

//When a conversation last had a message, so the most recently active ones come first.
const lastActivity = (thread) => new Date((thread.replies.at(-1) || thread).created_at).getTime();

//A conversation is a top-level comment written by a student plus the replies under it. Its first message's
//author is the student it belongs to, and only that student (and staff) may ever see it.
const ProblemSetComment = {
    //Every conversation on a question, or only that student's own when studentId is given.
    //The filtering happens here on the server, so another student's messages are never sent at all.
    async getConversations(questionId, studentId = null) {
        const [rows] = await db.execute(
            `${SELECT_COMMENT} WHERE c.question_id = ? ORDER BY c.created_at ASC, c.id ASC`, [questionId]
        );

        const threads = rows
            .filter((row) => row.parent_id === null && (studentId === null || row.author_id === studentId))
            .map((thread) => ({ ...thread, replies: [] }));
        const threadById = new Map(threads.map((thread) => [thread.id, thread]));
        rows.filter((row) => row.parent_id !== null).forEach((reply) => threadById.get(reply.parent_id)?.replies.push(reply));

        return threads.sort((a, b) => lastActivity(b) - lastActivity(a));
    },

    //The student's existing conversation on this question, if they've started one.
    async getThreadByStudent(questionId, studentId) {
        const [rows] = await db.execute(
            `SELECT id FROM problem_set_question_comments
             WHERE question_id = ? AND parent_id IS NULL AND author_id = ? ORDER BY id ASC LIMIT 1`,
            [questionId, studentId]
        );
        return rows[0];
    },

    async getById(commentId) {
        const [rows] = await db.execute(`${SELECT_COMMENT} WHERE c.id = ?`, [commentId]);
        return rows[0];
    },

    async create({ questionId, parentId, authorId, content }) {
        const [result] = await db.execute(
            `INSERT INTO problem_set_question_comments (question_id, parent_id, author_id, content, created_at)
             VALUES (?, ?, ?, ?, ?)`,
            [questionId, parentId, authorId, content, new Date()]
        );
        return result.insertId;
    },

    async update(commentId, content) {
        await db.execute(
            `UPDATE problem_set_question_comments SET content = ?, updated_at = ? WHERE id = ?`,
            [content, new Date(), commentId]
        );
    },

    async remove(commentId) {
        await db.execute(`DELETE FROM problem_set_question_comments WHERE id = ?`, [commentId]); //replies cascade
    }
};

export default ProblemSetComment;
