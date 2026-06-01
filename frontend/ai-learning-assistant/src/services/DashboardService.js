import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPath";

const getMainDashboard = async () => {
    try {
        const response = await axiosInstance.get(API_PATHS.DASHBOARD.GET_MAIN_DASHBOARD);
        return response.data;

    } catch (error) {
        console.error("Fail to fetch the main dashboard at the frontend due to: " + error);
        throw error;
    }
};

const mainDashboardService = {
    getMainDashboard
};

export default mainDashboardService;