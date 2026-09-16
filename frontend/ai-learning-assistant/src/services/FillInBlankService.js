import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPath";

const getSetsForDocument = async (documentId) => {
    try {
        const response = await axiosInstance.get(API_PATHS.FILL_IN_BLANK.GET_SETS_FOR_DOCUMENT(documentId));
        return response.data;

    } catch (error) {
        console.error("Fail to get the fill-in-the-blank sets by document at the frontend due to: " + error);
        throw error;
    }
};

const getAllSets = async () => {
    try {
        const response = await axiosInstance.get(API_PATHS.FILL_IN_BLANK.GET_ALL_SETS);
        return response.data;

    } catch (error) {
        console.error("Fail to get all fill-in-the-blank sets at the frontend due to: " + error);
        throw error;
    }
};

const getSetById = async (setId) => {
    try {
        const response = await axiosInstance.get(API_PATHS.FILL_IN_BLANK.GET_SET_BY_ID(setId));
        return response.data;

    } catch (error) {
        console.error("Fail to get the fill-in-the-blank set by id at the frontend due to: " + error);
        throw error;
    }
};

const submitSet = async (setId, answers) => {
    try {
        const response = await axiosInstance.post(API_PATHS.FILL_IN_BLANK.SUBMIT_SET(setId), { answers });
        return response.data;

    } catch (error) {
        console.error("Fail to submit the fill-in-the-blank set at the frontend due to: " + error);
        throw error;
    }
};

const getSetResults = async (setId) => {
    try {
        const response = await axiosInstance.get(API_PATHS.FILL_IN_BLANK.GET_SET_RESULT(setId));
        return response.data;

    } catch (error) {
        console.error("Fail to get the fill-in-the-blank result at the frontend due to: " + error);
        throw error;
    }
};

const deleteSet = async (setId) => {
    try {
        const response = await axiosInstance.delete(API_PATHS.FILL_IN_BLANK.DELETE_SET(setId));
        return response.data;

    } catch (error) {
        console.error("Fail to delete the fill-in-the-blank set at the frontend due to: " + error);
        throw error;
    }
};

const getSetHintByQuestionId = async (setId, questionId) => {
    try {
        const response = await axiosInstance.get(API_PATHS.FILL_IN_BLANK.GET_SET_HINT(setId, questionId));
        return response.data;

    } catch (error) {
        console.error("Fail to get the fill-in-the-blank hint based on question id at the service due to: " + error);
        throw error;
    }
};

const getShieldByQuestionId = async (setId, questionId) => {
    try {
        const response = await axiosInstance.get(API_PATHS.FILL_IN_BLANK.GET_SET_SHIELD(setId, questionId));
        return response.data;

    } catch (error) {
        console.error("Fail to get the fill-in-the-blank shield based on the question id at the service due to: " + error);
        throw error;
    }
};

const setHintOnQuestion = async (setId, questionId) => {
    try {
        const response = await axiosInstance.post(API_PATHS.FILL_IN_BLANK.SET_SET_HINT(setId, questionId));
        return response.data;

    } catch (error) {
        console.error("Fail to set the hint of the particular question at the service due to: " + error);
        throw error;
    }
};

const setShieldOnQuestion = async (setId, questionId) => {
    try {
        const response = await axiosInstance.post(API_PATHS.FILL_IN_BLANK.SET_SET_SHIELD(setId, questionId));
        return response.data;

    } catch (error) {
        console.error("Fail to set the shield of the particular question at the service due to: " + error);
        throw error;
    }
};

const fillInBlankService = {
    getSetsForDocument,
    getAllSets,
    getSetById,
    submitSet,
    getSetResults,
    deleteSet,
    getSetHintByQuestionId,
    setHintOnQuestion,
    getShieldByQuestionId,
    setShieldOnQuestion
};

export default fillInBlankService;
