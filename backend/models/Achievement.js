import db from '../config/MySQL.js';

const Achievement = {
    async displayAchievementStatistic(userId) {
        const connection = await db.getConnection();

        try {
            const [result] = await connection.execute(
                `
                SELECT a.id, a.current_level, a.total_points, a.current_steak, a.total_xp, a.current_rank
                FROM achievements a
                WHERE a.user_id = ?
                `, [userId]
            );

            return result;

        } catch (error) {
            console.error("Error when display the user achievements due to: " + error);
            throw error;

        } finally {
            connection.release();
        }
    },

    async displayAllBadges(userId) {
        const connection = await db.getConnection();

        try {
            const [allBadges] = await connection.execute(
                `
                SELECT * FROM daily_goal dg
                WHERE dg.user_id = ?
                `, [userId]
            );

            return allBadges;

        } catch (error) {
            console.error("Fail to retrieve all the badges for the user due to: " + error);
            throw error;

        } finally {
            connection.release();
        }
    },

    async displayAllPlayers() {
        const connection = await db.getConnection();

        try {
            const [allPlayers] = await connection.execute(
                `
                SELECT
                    u.id,
                    u.username,
                    COALESCE(a.total_xp, 0) AS total_xp,
                    COALESCE(a.current_level, 0) AS current_level
                FROM users u
                LEFT JOIN achievements a ON u.id = a.user_id
                ORDER BY a.total_xp DESC, u.username ASC
                `
            );

            return allPlayers;

        } catch (error) {
            console.error("Fail to retrieve all player's XP due to: " + error);
            throw error;

        } finally {
            connection.release();
        }
    },

    async displayAllUnlockFeatures(userId) {
        const connection = await db.getConnection();

        try {
            const [allUnlockFeatures] = await connection.execute(
                `
                SELECT * FROM unlocked_features uf
                WHERE uf.user_id = ?
                ORDER BY uf.id ASC
                `, [userId]
            );

            return allUnlockFeatures;

        } catch (error) {
            console.error("Fail to display all unlock features due to: " + error);
            throw error;

        } finally {
            connection.release();
        }
    },

    async displayDailyGoals(userId) {
        const connection = await db.getConnection();

        try {
            const [allDailyGoal] = await connection.execute(
                `
                SELECT * FROM daily_goal dg
                WHERE dg.user_id = ?
                `, [userId]
            );

            return allDailyGoal;

        } catch (error) {
            console.error("Fail to display all the daily goals due to: " + error);
            throw error;

        } finally {
            connection.release();
        }
    },

    async updateEarnPoints({ userId, earnPoints }) {
        const connection = await db.getConnection();

        try {
            await connection.execute(
                `
                UPDATE achievements
                SET total_points = total_points + ?
                WHERE user_id = ?
                `, [earnPoints, userId]

            );

            return true;

        } catch (error) {
            console.error("Fail to update the earn points at achievement js due to: " + error);
            throw error;

        } finally {
            connection.release();
        }
    },
    
    async retrieveAllLevelXP() {
        const connection = await db.getConnection();

        try {
            const [allLevel] = await connection.execute(
                `
                SELECT gl.level_number, gl.level_length
                FROM gamification_level gl
                ORDER BY gl.level_number ASC
                `
            );

            return allLevel;
            
        } catch (error) {
            console.error("Fail to retrieve all the level at the achievement js due to: " + error);
            throw error;

        } finally {
            connection.release();
        }
    },

    async updateLevelAndXP({ userId, newLevel, newLevelXP }) {
        const connection = await db.getConnection();

        try {
            await connection.execute(
                `
                UPDATE achievements
                SET current_level = ?,
                    total_xp = ?
                WHERE user_id = ?
                `, [newLevel, newLevelXP, userId]
            );

            return true;

        } catch (error) {
            console.error("Fail to update the user level and new XP at the Achievement due to: " + error);
            throw error;

        } finally {
            connection.release();
        }
    },

    async getCurrentLevelAndXP(userId) {
        const connection = await db.getConnection();

        try {
            const [userLevelAndXP] = await connection.execute(
                `
                SELECT a.current_level, a.total_xp, gl.level_length
                FROM achievements a
                JOIN gamification_level gl
                    ON a.current_level = gl.level_number
                WHERE a.user_id = ?
                `, [userId]
            );

            return userLevelAndXP[0];

        } catch (error) {
            console.error("Fail to retrieve the current level and XP at the Achievement due to: " + error);
            throw error;
            
        } finally {
            connection.release();
        }
    }
}

export default Achievement;