import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPath";

const getAllClasses = async (filters = {}) => {
    try {
        const response = await axiosInstance.get(API_PATHS.CLASS.GET_ALL_CLASSES, { params: filters });
        return response.data;

    } catch (error) {
        console.error("Fail to get all classes at the service due to: " + error);
        throw error.response?.data || error;
    }
};

const findClassByCode = async (code) => {
    try {
        const response = await axiosInstance.get(API_PATHS.CLASS.FIND_CLASS_BY_CODE(code));
        return response.data;

    } catch (error) {
        console.error("Fail to find the class by code at the service due to: " + error);
        throw error.response?.data || error;
    }
};

const createClass = async (className, maxStudents) => {
    try {
        const response = await axiosInstance.post(API_PATHS.CLASS.CREATE_CLASS, { className, maxStudents });
        return response.data;

    } catch (error) {
        console.error("Fail to create the class at the service due to: " + error);
        throw error.response?.data || error;
    }
};

const updateClass = async (id, className, maxStudents) => {
    try {
        const response = await axiosInstance.put(API_PATHS.CLASS.UPDATE_CLASS(id), { className, maxStudents });
        return response.data;

    } catch (error) {
        console.error("Fail to update the class at the service due to: " + error);
        throw error.response?.data || error;
    }
};

const deleteClass = async (id) => {
    try {
        const response = await axiosInstance.delete(API_PATHS.CLASS.DELETE_CLASS(id));
        return response.data;

    } catch (error) {
        console.error("Fail to delete the class at the service due to: " + error);
        throw error.response?.data || error;
    }
};

const joinClass = async (id) => {
    try {
        const response = await axiosInstance.post(API_PATHS.CLASS.JOIN_CLASS(id));
        return response.data;

    } catch (error) {
        console.error("Fail to join the class at the service due to: " + error);
        throw error.response?.data || error;
    }
};

const getClassWorkspace = async (id) => {
    try {
        const response = await axiosInstance.get(API_PATHS.CLASS.GET_CLASS_WORKSPACE(id));
        return response.data;

    } catch (error) {
        console.error("Fail to open the class workspace at the service due to: " + error);
        throw error.response?.data || error;
    }
};

const classService = { getAllClasses, findClassByCode, getClassWorkspace, createClass, updateClass, deleteClass, joinClass };

export default classService;
