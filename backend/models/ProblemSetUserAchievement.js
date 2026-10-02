import db from '../config/MySQL.js';

//Problem set achievements a student has earned, with the badge details from the set's achievement.
const ProblemSetUserAchievement = {
    //The student's earned achievements in one class, newest first. unseenOnly = the ones they haven't been shown yet.
    async listForStudent(classId, userId, { unseenOnly = false } = {}) {
        const [rows] = await db.execute(
            `SELECT ua.problem_set_id, p.title AS assessment, a.title, a.description, a.badge_image, a.min_points,
                    at.total_points, ua.score, ua.earned_at, ua.seen_at
             FROM problem_set_user_achievements ua
             JOIN problem_sets p ON p.id = ua.problem_set_id
             JOIN problem_set_achievements a ON a.problem_set_id = ua.problem_set_id
             JOIN problem_set_attempts at ON at.id = ua.attempt_id
             WHERE p.class_id = ? AND ua.user_id = ? ${unseenOnly ? 'AND ua.seen_at IS NULL' : ''}
             ORDER BY ua.earned_at DESC`,
            [classId, userId]
        );
        return rows.map((row) => ({ ...row, score: Number(row.score) }));
    },

    //The popup was shown and closed: don't show it again.
    async markSeen(problemSetId, userId) {
        await db.execute(
            `UPDATE problem_set_user_achievements SET seen_at = ? WHERE problem_set_id = ? AND user_id = ? AND seen_at IS NULL`,
            [new Date(), problemSetId, userId]
        );
    }
};

export default ProblemSetUserAchievement;
