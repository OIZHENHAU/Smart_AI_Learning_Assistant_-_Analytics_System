import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPath";
import axios from "axios";

const getAchievementStatistics = async () => {
    try {
        const response = await axiosInstance.get(API_PATHS.ACHIEVEMENT.GET_ACHIEVEMENT_STATISTICS);
        return response.data;

    } catch (error) {
        console.error("Fail to get all the achievement statistics at the service due to: " + error);
        throw error;
    }
};

const getAllBadges = async () => {
    try {
        const response = await axiosInstance.get(API_PATHS.ACHIEVEMENT.GET_ALL_BADGES);
        return response.data;

    } catch (error) {
        console.error("Fail to get all the badges at the service due to: " + error);
        throw error;
    }
};

const getAllPlayers = async () => {
    try {
        const response = await axiosInstance.get(API_PATHS.ACHIEVEMENT.GET_ALL_USER_XP);
        return response.data;

    } catch (error) {
        console.error("Fail to get all players at the service due to: " + error);
        throw error;
    }
};

const getAllUnlockFeatures = async () => {
    try {
        const response = await axiosInstance.get(API_PATHS.ACHIEVEMENT.GET_ALL_UNLOCK_FEATURES);
        return response.data;

    } catch (error) {
        console.error("Fail to get all the unlock features at the service due to: " + error);
        throw error;
    }
};

const getAllDailyGoals = async () => {
    try {
        const response = await axiosInstance.get(API_PATHS.ACHIEVEMENT.GET_ALL_DAILY_GOALS);
        return response.data;

    } catch (error) {
        console.error("Fail to get all daily goals at the service due to: " + error);
        throw error;
    }
};

const getCurrentLevelAndXP = async () => {
    try {
        const response = await axiosInstance.get(API_PATHS.ACHIEVEMENT.GET_CURRENT_LEVEL_AND_XP);
        return response.data;

    } catch (error) {
        console.error("Fail to get the current level and XP at the service due to: " + error);
        throw error;
    }
};

const postAllDailyGoals = async () => {
    try {
        const response = await axiosInstance.post(API_PATHS.ACHIEVEMENT.POST_ALL_DAILY_GOALS);
        return response.data;

    } catch (error) {
        console.error("Fail to post all daily goals at the service due to: " + error);
        throw error;
    }
};

const postAllBadges = async () => {
    try {
        const response = await axiosInstance.post(API_PATHS.ACHIEVEMENT.POST_ALL_BADGES);
        return response.message;

    } catch (error) {
        console.error("Fail to create all the badges at tthe service when creating an account due to: " + error);
        throw error;
    }
};

const postAllUnlockFeatures = async () => {
    try {
        const response = await axiosInstance.post(API_PATHS.ACHIEVEMENT.POST_ALL_UNLOCK_FEATURES);
        return response.message;

    } catch (error) {
        console.error("Fail to create all the unlock features at the service when creating an account due to: " + error);
        throw error;
    }
};

const redeemUnlockFeature = async (id) => {
    try {
        const response = await axiosInstance.post(API_PATHS.ACHIEVEMENT.REDEEM_UNLOCK_FEATURE(id));
        return response.data;

    } catch (error) {
        console.error("Fail to redeem the feature point at the service due to: " + error);
        throw error;
    }
};

const getHintFeature = async () => {
    try {
        const response = await axiosInstance.get(API_PATHS.ACHIEVEMENT.GET_HINT_FEATURE);
        return response.data;

    } catch (error) {
        console.error("Fail to get the hint features at the service due to: " + error);
        throw error;
    }
};

const getFreezeFeature = async () => {
    try {
        const response = await axiosInstance.get(API_PATHS.ACHIEVEMENT.GET_FREEZE_FEATURE);
        return response.data;

    } catch (error) {
        console.error("Fail to get the freeze features at the service due to: " + error);
        throw error;
    }
};

const getShieldFeature = async () => {
    try {
        const response = await axiosInstance.get(API_PATHS.ACHIEVEMENT.GET_SHIELD_FEATURE);
        return response.data;

    } catch (error) {
        console.error("Fail to get the shield features at the service due to: " + error);
        throw error;
    }
};

const useFreezeTimerFeature = async () => {
    try {
        const response = await axiosInstance.post(API_PATHS.ACHIEVEMENT.USE_FREEZE_FEATURE);
        return response.data;
         
    } catch (error) {
        console.error("Fail to use the freeze timer features at the service due to: " + error);
        throw error;
    }
};

const achievementService = {
    getAchievementStatistics,
    getAllBadges,
    getAllPlayers,
    getAllUnlockFeatures,
    getAllDailyGoals,
    getCurrentLevelAndXP,
    postAllDailyGoals,
    postAllBadges,
    postAllUnlockFeatures,
    redeemUnlockFeature,
    getHintFeature,
    getFreezeFeature,
    getShieldFeature,
    useFreezeTimerFeature
};

export default achievementService;