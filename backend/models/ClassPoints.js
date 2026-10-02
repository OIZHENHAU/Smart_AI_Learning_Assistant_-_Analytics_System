import db from '../config/MySQL.js';

//A student's points in a class = the sum of their GRADED problem set scores in that class. class_members.total_points
//keeps that sum ready for the leaderboard, and is always recalculated from the submissions (never added to), so a
//regrade or a deleted problem set can't leave it wrong. Pass a connection to run it inside an open transaction.
const RECALC_SQL = `
    UPDATE class_members m
    SET m.total_points = (
        SELECT COALESCE(SUM(a.score), 0)
        FROM problem_set_attempts a
        JOIN problem_sets p ON p.id = a.problem_set_id
        WHERE p.class_id = m.class_id AND a.user_id = m.user_id AND a.status = 'graded'
    )
    WHERE m.class_id = ?`;

const ClassPoints = {
    async recalcForStudent(classId, userId, connection = db) {
        await connection.execute(`${RECALC_SQL} AND m.user_id = ?`, [classId, userId]);
    },

    async recalcForClass(classId, connection = db) {
        await connection.execute(RECALC_SQL, [classId]);
    },

    async getForStudent(classId, userId) {
        const [rows] = await db.execute(
            `SELECT total_points FROM class_members WHERE class_id = ? AND user_id = ?`, [classId, userId]
        );
        return Number(rows[0]?.total_points ?? 0);
    },

    //Every approved student in the class, highest points first. Equal points share a rank (1, 2, 2, 4).
    async getLeaderboard(classId) {
        const [rows] = await db.execute(
            `SELECT u.id AS user_id, u.username, m.total_points,
                    (SELECT COUNT(*) FROM problem_set_attempts a
                     JOIN problem_sets p ON p.id = a.problem_set_id
                     WHERE p.class_id = m.class_id AND a.user_id = m.user_id AND a.status = 'graded') AS graded_count
             FROM class_members m
             JOIN users u ON u.id = m.user_id
             WHERE m.class_id = ? AND m.status = 'approved' AND u.role = 'student'
             ORDER BY m.total_points DESC, u.username ASC`,
            [classId]
        );

        let rank = 0;
        let previous = null;
        return rows.map((row, index) => {
            const points = Number(row.total_points);
            if (points !== previous) {
                rank = index + 1;
                previous = points;
            }
            return { ...row, total_points: points, rank };
        });
    }
};

export default ClassPoints;
