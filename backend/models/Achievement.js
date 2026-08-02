import db from '../config/MySQL.js';

const Achievement = {
    async displayAchievementStatistic(userId) {
        const connection = await db.getConnection();

        try {
            const [result] = await connection.execute(
                `
                SELECT a.id, a.current_level, a.total_points, a.current_steak, a.total_xp
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
                SELECT u.username, u.total_xp 
                FROM users u
                ORDER BY u.total_xp ASC
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
    }
}

export default Achievement;