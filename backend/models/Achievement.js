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
                SELECT * FROM badges bg
                WHERE bg.user_id = ? OR bg.user_id IS NULL
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

    async getHintUnlockFeature(userId) {
        const connection = await db.getConnection();

        try {
            const [hintFeature] = await connection.execute(
                `
                SELECT * FROM unlocked_features uf
                WHERE uf.user_id = ? AND uf.specific_type = 'hint'
                `, [userId]
            );

            return hintFeature[0];

        } catch (error) {
            console.error("Fail to retrieve the hint unlock feature at the Achievement due to: " + error);
            throw error;

        } finally {
            connection.release();
        }
    },

    async getFreezeUnlockFeature(userId) {
        const connection = await db.getConnection();

        try {
            const [freezeFeature] = await connection.execute(
                `
                SELECT * FROM unlocked_features uf
                WHERE uf.user_id = ? AND uf.specific_type = 'stop'
                `, [userId]
            );

            return freezeFeature[0];

        } catch (error) {
            console.error("Fail to get the freeze unlock features at the Achievemnt due to: " + error);
            throw error;

        } finally {
            connection.release();
        }
    },

    async getShieldUnlockFeature(userId) {
        const connection = await db.getConnection();

        try {
            const [shieldFeatures] = await connection.execute(
                `
                SELECT * FROM unlocked_features uf
                WHERE uf.user_id = ? AND uf.specific_type = 'block'
                `, [userId]
            );

            return shieldFeatures[0];

        } catch (error) {
            console.error("Fail to get the shield unlock features at the Achievement due to: " + error);
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
    },
    
    async addAllBadges({ userId, badgesList }) {
        const connection = await db.getConnection();

        try {
            if (!Array.isArray(badgesList) || badgesList.length === 0) {
                return false;
            }

            // build placeholders and params for batch insert
            const placeholders = badgesList.map(() => '(?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
            const params = [];
            for (const b of badgesList) {
                const title = b.title || "";
                const imagePath = b.image_path || "";
                const badge_description = b.badge_description || "";
                const requirement_type = b.requirement_type || "";
                const specific_type = b.specific_type || "";
                const target_value = b.target_value || 0;
                const current_value = b.current_value || 0;
                
                params.push(title, imagePath, badge_description, requirement_type, specific_type, target_value, current_value, userId ?? null);
            }

            const sql = `INSERT INTO badges (title, image_path, badge_description, requirement_type, specific_type, target_value, current_value, user_id) VALUES ${placeholders}`;
            await connection.execute(sql, params);

            return true;

        } catch (error) {
            console.error("Fail to create all badges at the Achievement due to: " + error);
            throw error;

        } finally {
            connection.release();

        }
    },

    async addAllUnlockFeatures({ userId, featureList }) {
        const connection = await db.getConnection();

        try {
            if (!Array.isArray(featureList) || featureList.length === 0) {
                return false;
            }

            //build a placeholder and parameters for batch insert
            const placeholders = featureList.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
            const params = [];

            for (const f of featureList) {
                const feature_name = f.feature_name || "";
                const feature_description = f.feature_description || "";
                const point_needed = f.point_needed || "";
                const limit_number = f.limit_number || "";
                const num_unlock = 0;

                params.push(feature_name, feature_description, point_needed, limit_number, num_unlock, userId ?? null);
            }

            const sql = `INSERT INTO unlocked_features (feature_name, feature_description, point_needed, limit_number, num_unlock, user_id) VALUES ${placeholders}`;
            await connection.execute(sql, params);

            return true;

        } catch (error) {
            console.error("Fail to create all the unlock features at the Achievement due to: " + error);
            throw error;

        } finally {
            connection.release();
        }
    },

    async redeemUnlockFeature({ userId, featureId }) {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const [featureRows] = await connection.execute(
                `
                SELECT id, point_needed, limit_number, num_unlock
                FROM unlocked_features
                WHERE id = ? AND user_id = ?
                FOR UPDATE
                `, [featureId, userId]
            );

            const feature = featureRows[0];

            if (!feature) {
                await connection.rollback();
                return {
                    success: false,
                    message: "The current feature was not found."
                };
            }

            if (feature.num_unlock >= feature.limit_number) {
                await connection.rollback();
                return {
                    success: false,
                    message: "The redeem point for this feature has reached it's limit."
                }
            }

            const [achievementRows] = await connection.execute(
                `
                SELECT total_points
                FROM achievements
                WHERE user_id = ?
                FOR UPDATE
                `, [userId]
            );

            const achievement = achievementRows[0];

            if (!achievement || achievement.total_points < feature.point_needed) {
                await connection.rollback();
                return {
                    success: false,
                    message: "Not enough points to redeem this features."
                }
            }

            await connection.execute(
                `
                UPDATE achievements
                SET total_points = total_points - ?
                WHERE user_id = ?
                `, [feature.point_needed, userId]
            );

            await connection.execute(
                `
                UPDATE unlocked_features
                SET num_unlock = num_unlock + 1
                WHERE id = ?
                `, [featureId]
            );

            await connection.commit();

            return {
                success: true,
                current_feature: feature,
                num_unlock: feature.num_unlock + 1,
                remaining_points: achievement.total_points - feature.point_needed
            };

        } catch (error) {
            console.error("Fail to redeem the feature with id: " + featureId + " at the Achievement due to: " + error);
            throw error;

        } finally {
            connection.release();
        }
    },

    async updateBadgesProgress({ userId, eventType, specificType, amount }) {
        const connection = await db.getConnection();
        
        try {
            await connection.execute(
                `
                UPDATE badges
                SET current_value = LEAST(current_value + ?, target_value),
                    is_unlocked = (current_value + ? >= target_value)
                WHERE user_id = ? AND requirement_type = ?
                AND (specific_type = ? OR specific_type = '')
                AND is_unlocked = FALSE
                `, [amount, amount, userId, eventType, specificType]
            );

            return true;

        } catch (error) {
            console.error("Fail to update the progress of the badges at the Achievement due to: " + error);
            throw error;

        } finally {
            connection.release();
        }
    },

    async updateDailyGoalProgress({ userId, eventType, amount }) {
        const connection = await db.getConnection();
        
        try {
            await connection.execute(
                `
                UPDATE daily_goal
                SET number_complete = LEAST(number_complete + ?, num_achieve),
                    completed = (number_complete + ? >= num_achieve)
                WHERE user_id = ? AND main_focus = ? AND number_complete < num_achieve
                `, [amount, amount, userId, eventType]
            );

            return true;

        } catch (error) {
            console.error("Fail to update the daily goals progress at the Achievement due to: " + error);
            throw error;

        } finally {
            connection.release();
        }
    },

    async useFreezeUnlockFeature(userId) {
        const connection = await db.getConnection();

        try {
            const [result] = await connection.execute(
                `
                UPDATE unlocked_features uf
                SET uf.num_unlock = uf.num_unlock - 1
                WHERE uf.user_id = ? AND uf.specific_type = 'stop' AND uf.num_unlock > 0
                `, [userId]
            );

            return result.affectedRows > 0;

        } catch (error) {
            console.error("Fail to use freeze features on the question at the Achievement due to: " + error);
            throw error;

        } finally {
            connection.release();
        }
    },

    async getLeaderboardByLevel() {
        const connection = await db.getConnection();

        try {
            const [allUserLevel] = await connection.execute(
                `
                SELECT u.username, a.current_level, a.total_xp
                FROM achievements a
                    JOIN users u ON u.id = a.user_id
                ORDER BY a.total_xp DESC
                `
            );

            return allUserLevel;

        } catch (error) {
            console.error("Fail to get the leaderboard by level at the Achievement due to: " + error);
            throw error;

        } finally {
            connection.release();

        }
    },

    async getLeaderboardByNumOfBadges() {
        const connection = await db.getConnection();

        try {
            const [allUserNumAchievement] = await connection.execute(
                `
                SELECT u.id AS user_id, u.username, bg.id AS badge_id, 
                        bg.title, bg.image_path
                FROM users u
                LEFT JOIN badges bg
                    ON bg.user_id = u.id AND bg.is_unlocked = TRUE
                ORDER BY u.username ASC
                `
            );

            //Group the flat rows into the one entry per user, each carry their unlock badges
            const leaderboardMap = new Map();

            for (const row of allUserNumAchievement) {
                if (!leaderboardMap.has(row.user_id)) {
                    leaderboardMap.set(row.user_id, {
                        userId: row.user_id,
                        username: row.username,
                        badges: []
                    });
                }

                //bg.id is null when the LEFT JOIN found no unlock badges for this user
                if (row.badge_id) {
                    leaderboardMap.get(row.user_id).badges.push({
                        id: row.badge_id,
                        title: row.title,
                        image_path: row.image_path
                    });
                }
            }

            //Rank by number of unlocked badges in DESC order
            const leaderboard = Array.from(leaderboardMap.values()).sort((a, b) => b.badges.length - a.badges.length);

            return leaderboard;

        } catch (error) {
            console.error("Fail to get the leaderboard by number of achievements at the Achievements due to: " + error);
            throw error;

        } finally {
            connection.release();

        }
    }
}

export default Achievement;