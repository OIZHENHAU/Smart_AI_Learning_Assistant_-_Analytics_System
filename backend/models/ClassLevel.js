import db from '../config/MySQL.js';

//A class's levels: each needs xp_required experience points (class points) and may have one achievement.
const ClassLevel = {
    //Every level of the class in order, each with its achievement (or null).
    async getLevels(classId) {
        const [rows] = await db.execute(
            `SELECT l.id, l.level_number, l.xp_required, a.title, a.description, a.badge_image
             FROM class_levels l LEFT JOIN class_level_achievements a ON a.level_id = l.id
             WHERE l.class_id = ? ORDER BY l.level_number ASC`, [classId]
        );
        return rows.map((r) => ({
            id: r.id,
            levelNumber: r.level_number,
            xpRequired: r.xp_required,
            achievement: r.title ? { title: r.title, description: r.description, badgeImage: r.badge_image } : null
        }));
    },

    //Saves the class details and replaces its level list in one transaction. Levels that still exist keep their id
    //(so anything that refers to them later stays linked); removed ones are deleted.
    //levels = [{ id?, xpRequired, achievement: null | { title, description, badgeImage } }], in order.
    //Returns the badge filenames no longer used, so the caller can delete the files.
    async saveSettings(classId, { className, maxStudents, classCode }, levels) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            await connection.execute(
                `UPDATE classes SET class_name = ?, max_students = ?, class_code = ? WHERE id = ?`,
                [className, maxStudents, classCode, classId]
            );

            const [existing] = await connection.execute(
                `SELECT l.id, a.badge_image FROM class_levels l
                 LEFT JOIN class_level_achievements a ON a.level_id = l.id WHERE l.class_id = ?`, [classId]
            );
            const oldBadge = new Map(existing.map((row) => [row.id, row.badge_image]));
            const keptIds = new Set(levels.filter((l) => l.id && oldBadge.has(l.id)).map((l) => l.id));
            const unusedBadges = [];

            for (const row of existing) {
                if (keptIds.has(row.id)) continue;
                if (row.badge_image) unusedBadges.push(row.badge_image);
                await connection.execute(`DELETE FROM class_levels WHERE id = ?`, [row.id]); //achievement cascades
            }

            //Move the kept levels out of the way first, so renumbering can't clash with (class_id, level_number).
            await connection.execute(`UPDATE class_levels SET level_number = level_number + 1000 WHERE class_id = ?`, [classId]);

            for (const [index, level] of levels.entries()) {
                let levelId = keptIds.has(level.id) ? level.id : null;
                if (levelId) {
                    await connection.execute(
                        `UPDATE class_levels SET level_number = ?, xp_required = ? WHERE id = ?`,
                        [index + 1, level.xpRequired, levelId]
                    );
                } else {
                    const [result] = await connection.execute(
                        `INSERT INTO class_levels (class_id, level_number, xp_required) VALUES (?, ?, ?)`,
                        [classId, index + 1, level.xpRequired]
                    );
                    levelId = result.insertId;
                }

                const previousBadge = oldBadge.get(levelId) ?? null;
                if (!level.achievement) {
                    await connection.execute(`DELETE FROM class_level_achievements WHERE level_id = ?`, [levelId]);
                    if (previousBadge) unusedBadges.push(previousBadge);
                    continue;
                }

                const { title, description, badgeImage } = level.achievement;
                await connection.execute(
                    `INSERT INTO class_level_achievements (level_id, title, description, badge_image) VALUES (?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description), badge_image = VALUES(badge_image)`,
                    [levelId, title, description, badgeImage]
                );
                if (previousBadge && previousBadge !== badgeImage) unusedBadges.push(previousBadge);
            }

            await connection.commit();
            return unusedBadges;

        } catch (error) {
            await connection.rollback();
            throw error;

        } finally {
            connection.release();
        }
    },

    //Read before a class is deleted: the rows cascade away, but not the badge files.
    async getBadgeFileNamesByClass(classId) {
        const [rows] = await db.execute(
            `SELECT a.badge_image FROM class_level_achievements a
             JOIN class_levels l ON l.id = a.level_id WHERE l.class_id = ? AND a.badge_image IS NOT NULL`, [classId]
        );
        return rows.map((row) => row.badge_image);
    }
};

export default ClassLevel;
