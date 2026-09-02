import express from 'express';
import protect from "../middleware/Auth.js";
import upload from "../config/multer.js";
import {
    displayAchievementStatistic,
    displayAllBadges,
    displayAllDailyGoals,
    displayAllUnlockFeatures,
    displayAllUserXP,
    getCurrentLevelAndXP,
    postAllDailyGoals, 
    postAllAchievementBadges,
    postAllUnlockFeatures,
    redeemUnlockFeature,
    getHintFeature,
    getFreezeFeature,
    getShieldFeature,
    useFreezeFeature,
    getLeaderboardByLevel,
    getLeaderboardByAchievements
} from "../controller/AchievementController.js";

const router = express.Router();
router.use(protect);

//Display the achievement statistics
router.get('/achievement-page', displayAchievementStatistic);
//Display all the badges
router.get('/all-badges', displayAllBadges);
//Display all the unlock features
router.get('/all-unlock-features', displayAllUnlockFeatures);
//Dispplay all the user XP
router.get('/all-user-xp', displayAllUserXP);
//Display all the daily goals
router.get('/all-daily-goals', displayAllDailyGoals);
//Get the current level and XP of the user
router.get('/current-level-and-xp', getCurrentLevelAndXP);
//Put all the daily goals when the user first create the account
router.post('/daily-goals', postAllDailyGoals);
//Create all the achievement badges (seed)
router.post('/create-badges', postAllAchievementBadges);
//CRreate all the unlock features
router.post('/create-unlock-features', postAllUnlockFeatures);
//Redeem features
router.post('/redeem-unlock-feature/:id', redeemUnlockFeature);
//Get the hint features
router.get('/get-hint-feature', getHintFeature);
//Get the freeze features
router.get('/get-freeze-feature', getFreezeFeature);
//Get the shield features
router.get('/get-shield-feature', getShieldFeature);
//Use freeze timer features
router.post('/use-freeze-feature', useFreezeFeature);
//Get the leaderboard of all users based on their level and XP
router.get('/leaderboard-level', getLeaderboardByLevel);
//Get the leaderboard of all users based on their number of achievements
router.get('/leaderboard-achievements', getLeaderboardByAchievements);

export default router;