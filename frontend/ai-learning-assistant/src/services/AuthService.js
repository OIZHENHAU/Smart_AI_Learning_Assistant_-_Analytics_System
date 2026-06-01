import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPath';

const login = async (email, password) => {
    try {
        const response = await axiosInstance.post(API_PATHS.AUTH.LOGIN, {
            email,
            password
        });

        return response.data;

    } catch (error) {
        console.error("Fail to login the user due to: " + error);
        throw error.response?.data || { message: "An unknown error occurred." };
    }
};

const register = async (username, email, password) => {
    try {
        const response = await axiosInstance.post(API_PATHS.AUTH.REGISTER, {
            username,
            email,
            password
        });

        return response.data;

    } catch (error) {
        console.error("Fail to register the user due to: " + error);
        throw error.response?.data || { message: "An unknown error occurred." };
    }
};

const getProfile = async () => {
    try {
        const response = await axiosInstance.get(API_PATHS.AUTH.GET_PROFILE);

        return response.data;

    } catch (error) {
        throw error.response?.data || { message: "An unknown error occurred. " };
    }
};

const updateProfile = async (userData) => {
    try {
        const response = await axiosInstance.put(API_PATHS.AUTH.UPDATE_PROFILE, {userData});

        return response.data;

    } catch (error) {
        console.error("Fail to update the profile at frontend due to: " + error);
        throw error;
    }
};

const changePassword = async (passwords) => {
    try {
        const response = await axiosInstance.post(API_PATHS.AUTH.CHANGE_PASSWORD, {passwords});

        return response.data;

    } catch (error) {
        console.error("Fail to change the password at the frontend due to: " + error);
        throw error;
    }
};

const authService = {
    login, register, getProfile, updateProfile, changePassword
};

export default authService;