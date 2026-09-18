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

const register = async (username, email, password, role) => {
    try {
        const response = await axiosInstance.post(API_PATHS.AUTH.REGISTER, {
            username,
            email,
            password,
            role
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
        const response = await axiosInstance.put(API_PATHS.AUTH.UPDATE_PROFILE, userData);

        return response.data;

    } catch (error) {
        console.error("Fail to update the profile at frontend due to: " + error);
        throw error;
    }
};

const changePassword = async (passwords) => {
    try {
        const response = await axiosInstance.post(API_PATHS.AUTH.CHANGE_PASSWORD, passwords);

        return response.data;

    } catch (error) {
        console.error("Fail to change the password at the frontend due to: " + error);
        throw error;
    }
};

const deleteAccount = async () => {
    try {
        const response = await axiosInstance.delete(API_PATHS.AUTH.DELETE_ACCOUNT);
        return response.data;
    } catch (error) {
        console.error("Fail to delete account at the frontend due to: " + error);
        throw error;
    }
};

const getAllUsersForAdmin = async () => {
    try {
        const response = await axiosInstance.get(API_PATHS.AUTH.ADMIN_GET_USERS);
        return response.data;

    } catch (error) {
        console.error("Fail to get all users for admin at the frontend due to: " + error);
        throw error.response?.data || { message: "An unknown error occurred." };
    }
};

const approveUser = async (userId) => {
    try {
        const response = await axiosInstance.post(API_PATHS.AUTH.ADMIN_APPROVE_USER(userId));
        return response.data;

    } catch (error) {
        console.error("Fail to approve the user at the frontend due to: " + error);
        throw error.response?.data || { message: "An unknown error occurred." };
    }
};

const deactivateUser = async (userId) => {
    try {
        const response = await axiosInstance.post(API_PATHS.AUTH.ADMIN_DEACTIVATE_USER(userId));
        return response.data;

    } catch (error) {
        console.error("Fail to deactivate the user at the frontend due to: " + error);
        throw error.response?.data || { message: "An unknown error occurred." };
    }
};

const deleteUserByAdmin = async (userId) => {
    try {
        const response = await axiosInstance.delete(API_PATHS.AUTH.ADMIN_DELETE_USER(userId));
        return response.data;

    } catch (error) {
        console.error("Fail to delete the user (admin) at the frontend due to: " + error);
        throw error.response?.data || { message: "An unknown error occurred." };
    }
};

const authService = {
    login, register, getProfile, updateProfile, changePassword, deleteAccount,
    getAllUsersForAdmin, approveUser, deactivateUser, deleteUserByAdmin
};

export default authService;