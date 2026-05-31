import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPath";
import axios from "axios";

const getProgressDashboard = async () => {
    try {
        const response = await axiosInstance.get(API_PATHS.PROGRESS.GET_DASHBOARD);
        return response.data;

    } catch (error) {
        console.error("Fail to fetch the progress dashboard at the frontend due to: " + error);
        throw error;
    }
};

const getStartSession = async () => {
    try {
        const response = await axiosInstance.get(API_PATHS.PROGRESS.GET_START_SESSION);
        return response.data;

    } catch (error) {
        console.error("Fail to get the start session at the frontend due to: " + error);
        throw error;
    }
};

const getEndSession = async (sessionId) => {
    try {
        const response = await axiosInstance.get(API_PATHS.PROGRESS.GET_END_SESSION(sessionId));
        return response.data;

    } catch (error) {
        console.error("Fail to get the end session at the frontend due to: " + error);
        throw error;
    }
};

const progressService = {
    getProgressDashboard,
    getStartSession,
    getEndSession
};

export default progressService;