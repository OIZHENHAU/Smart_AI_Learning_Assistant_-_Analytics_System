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

    async displayAllDailyGoals(userId) {
        const connection = await db.getConnection();

        try {
            const [allDailyGoal] = await connection.execute(
                `
                SELECT * FROM daily_goal dg
                WHERE dg.user_id = ?
                `, [userId]
            );

            // compute next day at 8:00 AM as the reset time
            const now = new Date();
            const nextReset = new Date(now);
            nextReset.setDate(now.getDate() + 1);
            nextReset.setHours(8, 0, 0, 0);
            const resetInSeconds = Math.max(0, Math.floor((nextReset - now) / 1000));

            return {
                dailyGoals: allDailyGoal,
                reset_at: nextReset.toISOString(),
                reset_in_seconds: resetInSeconds
            };

        } catch (error) {
            console.error("Fail to display all the daily goals due to: " + error);
            throw error;

        } finally {
            connection.release();
        }
    },

    async resetDailyGoalsIfDue() {
        const connection = await db.getConnection();

        try {
            await connection.execute(
                `
                UPDATE daily_goal
                SET number_complete = 0,
                    completed = FALSE,
                    last_reset = NOW()
                WHERE DATE(last_reset) < CURDATE()
                `
            );

            return true;

        } catch (error) {
            console.error("Fail to reset the daily goals at the Achievement due to: " + error);
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
    },

    async addDailyGoals(userId) {
        const connection = await db.getConnection();

        try {
            await connection.execute(
                `
                INSERT INTO daily_goal (user_id, number_complete, goal_description, main_focus, num_achieve, completed, last_reset)
                VALUES (?, 0, 'Complete 3 quizzes', 'quiz', 3, FALSE, NOW()),
                          (?, 0, 'Study for 30 minutes', 'study_time', 30, FALSE, NOW()),
                          (?, 0, 'Chat with AI assistant 10 times', 'chat', 10, FALSE, NOW()),
                          (?, 0, 'Gain 100XP', 'xp', 100, FALSE, NOW()),
                          (?, 0, 'Upload 2 documents', 'upload', 2, FALSE, NOW())
                `, [userId, userId, userId, userId, userId]
            );

            return true;

        } catch (error) {
            console.error("Fail to add daily goals at the Achievement due to: " + error);
            throw error;

        } finally {
            connection.release();
        }
    }
}

export default Achievement;