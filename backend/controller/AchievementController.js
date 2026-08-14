import Achievement from "../models/Achievement.js";

//Get the achievement statistic GET /api/achievements
export const displayAchievementStatistic = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const achievementStatistic = await Achievement.displayAchievementStatistic(userId);

        res.status(200).json({
            success: true,
            data: achievementStatistic,
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to display the achievements statistic at the controller due to: " + error);
        next(error);
    }
}

//Get all the badges GET /api/all-badges
export const displayAllBadges = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const badges = await Achievement.displayAllBadges(userId);

        res.status(200).json({
            success: true,
            data: badges,
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to display all the badges at the controller due to: " + error);
        next(error);
    }
}

//Get all the user list GET /api/all-user
export const displayAllUserXP = async (req, res, next) => {
    try {
        const allUsers = await Achievement.displayAllPlayers();

        res.status(200).json({
            success: true,
            data: allUsers,
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to display all user list with XP at the controller due to: " + error);
        next(error);
    }
}

//Get all the unlock features GET /api/all-unlock-features
export const displayAllUnlockFeatures = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const allUnlockFeatures = await Achievement.displayAllUnlockFeatures(userId);

        res.status(200).json({
            success: true,
            data: allUnlockFeatures,
            statusCode: 200
        });
    
    } catch (error) {
        console.error("Fail to display all the unlock features at the controller due to: " + error);
        next(error);
    }
}

//Get all the daily goals GET /api/all-daily-goals
export const displayAllDailyGoals = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const allDailyGoals = await Achievement.displayAllDailyGoals(userId);

        res.status(200).json({
            success: true,
            data: allDailyGoals,
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to display all the daily goals at the controller due to: " + error);
        next(error);
    }
}

//GET the current level and XP od the user GET /api/current-level-and-xp
export const getCurrentLevelAndXP = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const currentLevelAndXP = await Achievement.getCurrentLevelAndXP(userId);

        res.status(200).json({
            success: true,
            data: currentLevelAndXP,
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to retrieve the current level and XP at the controller due to: " + error);
        next(error);
    }
}

//POST all the daily goals when the user first create the account POST /api/daily-goals
export const postAllDailyGoals = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const daily_goals = await Achievement.addDailyGoals(userId);

        res.status(200).json({
            success: true,
            data: daily_goals,
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to post all the daily goals at the controller due to: " + error);
        next(error);
    }
}