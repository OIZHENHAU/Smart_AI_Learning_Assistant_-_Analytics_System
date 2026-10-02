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

const getClassMembers = async (classId, filters = {}) => {
    try {
        const response = await axiosInstance.get(API_PATHS.CLASS.MEMBERS(classId), { params: filters });
        return response.data;

    } catch (error) {
        console.error("Fail to get the class members at the service due to: " + error);
        throw error.response?.data || error;
    }
};

const approveClassMember = async (classId, userId) => {
    try {
        const response = await axiosInstance.put(API_PATHS.CLASS.APPROVE_MEMBER(classId, userId));
        return response.data;

    } catch (error) {
        console.error("Fail to approve the class member at the service due to: " + error);
        throw error.response?.data || error;
    }
};

const deactivateClassMember = async (classId, userId) => {
    try {
        const response = await axiosInstance.put(API_PATHS.CLASS.DEACTIVATE_MEMBER(classId, userId));
        return response.data;

    } catch (error) {
        console.error("Fail to deactivate the class member at the service due to: " + error);
        throw error.response?.data || error;
    }
};

const removeClassMember = async (classId, userId) => {
    try {
        const response = await axiosInstance.delete(API_PATHS.CLASS.REMOVE_MEMBER(classId, userId));
        return response.data;

    } catch (error) {
        console.error("Fail to remove the class member at the service due to: " + error);
        throw error.response?.data || error;
    }
};

//Approved students ranked by their class points (sum of their graded problem set scores).
const getClassLeaderboard = async (classId) => {
    try {
        const response = await axiosInstance.get(API_PATHS.CLASS.CLASS_LEADERBOARD(classId));
        return response.data;

    } catch (error) {
        console.error("Fail to get the class leaderboard at the service due to: " + error);
        throw error.response?.data || error;
    }
};

const getClassLevels = async (classId) => {
    try {
        const response = await axiosInstance.get(API_PATHS.CLASS.CLASS_LEVELS(classId));
        return response.data;

    } catch (error) {
        console.error("Fail to get the class levels at the service due to: " + error);
        throw error.response?.data || error;
    }
};

//A new class code that no other class uses (saved only when the settings are saved).
const generateClassCode = async (classId) => {
    try {
        const response = await axiosInstance.post(API_PATHS.CLASS.CLASS_NEW_CODE(classId));
        return response.data;

    } catch (error) {
        console.error("Fail to generate a class code at the service due to: " + error);
        throw error.response?.data || error;
    }
};

//formData: className, maxStudents, classCode, levels (JSON) and badge_<index> images.
const saveClassSettings = async (classId, formData) => {
    try {
        const response = await axiosInstance.put(API_PATHS.CLASS.CLASS_SETTINGS(classId), formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;

    } catch (error) {
        console.error("Fail to save the class settings at the service due to: " + error);
        throw error.response?.data || error;
    }
};

const classService = {
    getAllClasses, findClassByCode, getClassWorkspace, createClass, updateClass, deleteClass, joinClass,
    getClassMembers, approveClassMember, deactivateClassMember, removeClassMember, getClassLeaderboard,
    getClassLevels, generateClassCode, saveClassSettings
};

export default classService;
