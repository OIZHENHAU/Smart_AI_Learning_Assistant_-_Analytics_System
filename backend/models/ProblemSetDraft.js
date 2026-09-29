import db from '../config/MySQL.js';

//A student's saved-but-not-submitted attempt: one per student per set, replaced on every save.
const ProblemSetDraft = {
    //{ id, answers, savedAt, files } or null when the student hasn't saved anything yet.
    async get(problemSetId, userId) {
        const [rows] = await db.execute(
            `SELECT id, answers, saved_at FROM problem_set_attempt_drafts WHERE problem_set_id = ? AND user_id = ?`,
            [problemSetId, userId]
        );
        const draft = rows[0];
        if (!draft) return null;

        const [files] = await db.execute(
            `SELECT id, question_id, original_name, file_name, file_size FROM problem_set_draft_files
             WHERE draft_id = ? ORDER BY id ASC`, [draft.id]
        );

        let answers = [];
        try { answers = JSON.parse(draft.answers); } catch { answers = []; }

        return { id: draft.id, answers, savedAt: draft.saved_at, files };
    },

    //Replaces the draft's answers and file list in one transaction.
    //keepFileIds = the draft's existing files the student still has; newFiles = [{ questionId, originalName, fileName, fileSize }].
    //Returns the filenames of the files that were dropped, so the caller can delete them from disk.
    async save(problemSetId, userId, answers, keepFileIds, newFiles) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            await connection.execute(
                `INSERT INTO problem_set_attempt_drafts (problem_set_id, user_id, answers, saved_at) VALUES (?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE answers = VALUES(answers), saved_at = VALUES(saved_at)`,
                [problemSetId, userId, JSON.stringify(answers), new Date()]
            );
            const [[draft]] = await connection.execute(
                `SELECT id FROM problem_set_attempt_drafts WHERE problem_set_id = ? AND user_id = ? FOR UPDATE`,
                [problemSetId, userId]
            );

            const [existing] = await connection.execute(
                `SELECT id, file_name FROM problem_set_draft_files WHERE draft_id = ?`, [draft.id]
            );
            const keep = new Set(keepFileIds);
            const dropped = existing.filter((f) => !keep.has(f.id));
            for (const file of dropped) {
                await connection.execute(`DELETE FROM problem_set_draft_files WHERE id = ?`, [file.id]);
            }
            for (const file of newFiles) {
                await connection.execute(
                    `INSERT INTO problem_set_draft_files (draft_id, question_id, original_name, file_name, file_size) VALUES (?, ?, ?, ?, ?)`,
                    [draft.id, file.questionId, file.originalName, file.fileName, file.fileSize]
                );
            }

            await connection.commit();
            return dropped.map((f) => f.file_name);

        } catch (error) {
            await connection.rollback();
            throw error;

        } finally {
            connection.release();
        }
    },

    //Deletes the draft rows only (its files' rows cascade). The files on disk are left to the caller,
    //because after a submit they belong to the attempt.
    async remove(problemSetId, userId) {
        await db.execute(`DELETE FROM problem_set_attempt_drafts WHERE problem_set_id = ? AND user_id = ?`, [problemSetId, userId]);
    }
};

export default ProblemSetDraft;
