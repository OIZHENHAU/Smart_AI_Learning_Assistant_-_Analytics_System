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

        // Keep response backward-compatible: put the array in `data` and reset info in `meta`
        if (allDailyGoals && allDailyGoals.dailyGoals) {
            res.status(200).json({
                success: true,
                data: allDailyGoals.dailyGoals,
                meta: {
                    reset_at: allDailyGoals.reset_at,
                    reset_in_seconds: allDailyGoals.reset_in_seconds
                },
                statusCode: 200
            });
        } else {
            res.status(200).json({
                success: true,
                data: allDailyGoals,
                statusCode: 200
            });
        }

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

//POST all the achievement badges when the user first create the account POST /api/create-badges
export const postAllAchievementBadges = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const baseURL = `http://localhost:${process.env.PORT || 5528}`;

        const ALL_BADGES = [
            { title: 'Feeling 22', badge_description: 'Everything will be alright', image_path: `${baseURL}/uploads/badges/medium_level22.png`, requirement_type: "streak", specific_type: "", target_value: 0, current_value: 0 },
            { title: 'Train Expert', badge_description: 'Generate summary for more than 50 times', image_path: `${baseURL}/uploads/badges/medium_training.png`, requirement_type: "summary", specifc_type: "", target_value: 50, current_value: 0 },
            { title: 'Breakthrough', badge_description: 'Solve correctly on 20 difficulty questions', image_path: `${baseURL}/uploads/badges/medium_breakthrough.png`, requirement_type: "quiz", specific_type: "difficult", target_value: 20, current_value: 0 },
            { title: 'AI Explorer', badge_description: 'Using AI assistant frequently', image_path: `${baseURL}/uploads/badges/chat-ai-bot.png`, requirement_type: 'chat', specific_type: '', target_value: 100, current_value: 0 },
            { title: 'Python Expert', badge_description: 'Complete 10 python quizzes', image_path: `${baseURL}/uploads/badges/medium_favpng_snake-ball-python-clip-art.png`, requirement_type: "quiz", specific_type: "python", target_value: 10, current_value: 0 },
            
        ];

        const createBadges = await Achievement.addAllBadges({ userId, badgesList: ALL_BADGES });
        
        if (!createBadges) {
            return res.status(400).json({
                success: false,
                message: "No badges was created.",
                statusCode: 400
            });
        }

        res.status(201).json({
            success: true,
            message: "The badges was created.",
            statusCode: 201
        });

    } catch (error) {
        console.error("FAil to create all badges at the achievement controllerdue to: " + error);
        next(error);
    }
}

//POST all the unlock features when the user first create the account POST /api/create-unlock-features
export const postAllUnlockFeatures = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const baseURL = `http://localhost:${process.env.PORT || 5528 }`;

        const REDEEM_POINTS = [
            { feature_name: 'AI Hints', feature_description: 'Get hints from AI when answering quiz', point_needed: 5, limit_number: 5, specific_type: "hint", main_type: "quiz", specific_number: 0 },
            { feature_name: 'Score Shield', feature_description: 'Protect your points from losing.', point_needed: 10, limit_number: 5, specific_type: "block", main_type: "quiz", specific_number: 0 },
            { feature_name: 'Extra Attempt', feature_description: 'Allow an extra attempt of quiz.', point_needed: 30, limit_number: 3, specific_type: "extra attempt", main_type: "quiz", specific_number: 1 },
            { feature_name: 'Stop Timer', feature_description: 'Stop the quiz time for 10 seconds.', point_needed: 30, limit_number: 3, specific_type: "stop", main_type: "quiz", specific_number: 10 },
            { feature_name: 'Flashcards', feature_description: 'Unlock flashcards on any documents.', point_needed: 8, limit_number: 5, specific_type: "flashcards", main_type: "flashcards", specific_number: 0 },
            { feature_name: 'Fill-In The Blank Question', feature_description: 'Unlock flashcards on any documents.', point_needed: 8, limit_number: 5, specific_type: "fill-in-blank", main_type: "fill-in-blank", specific_number: 0 }
        ];

        const unlockFeatures = await Achievement.addAllUnlockFeatures({ userId, featureList: REDEEM_POINTS });

        if (!unlockFeatures) {
            return res.status(400).json({
                success: false,
                message: "The unlock features was not created.",
                statusCode: 400
            })
        }

        res.status(201).json({
            success: true,
            message: "The unlock features was created.",
            statusCode: 201
        });

    } catch (error) {
        console.error("Fail to create the unlock features at the achievement controleler due to: " + error);
        next(error);
    }
}

//POST redeem a feature POST /api/achievements/redeem-unlock-feature/:id
export const redeemUnlockFeature = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const featureId = req.params.id;

        const result = await Achievement.redeemUnlockFeature({ userId, featureId });

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message,
                statusCode: 400
            });
        }

        res.status(200).json({
            success: true,
            data: {
                current_feature: result.current_feature,
                num_unlock: result.num_unlock,
                remaining_points: result.remaining_points

            },
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to redeem the feature at the controller due to: " + error);
        next(error);
        
    }
}