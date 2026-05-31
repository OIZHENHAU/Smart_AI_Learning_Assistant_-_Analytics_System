import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPath";
import axios from "axios";

const getQuizzesForDocument = async (documentId) => {
    try {
        const response = await axiosInstance.get(API_PATHS.QUIZZES.GET_QUIZZES_FOR_DOCUMENT(documentId));

        return response.data;

    } catch (error) {
        console.error("Fail to vget the quiz by docuemnt at the frontend due to: " + error);
        throw error;
    }
};

const getQuizById = async (quizId) => {
    try {
        const response = await axiosInstance.get(API_PATHS.QUIZZES.GET_QUIZ_BY_ID(quizId));
        return response.data;

    } catch (error) {
        console.error("Fail to get the quiz by id at the frontend due to: " + error);
        throw error;
    }
};

const submitQuiz = async (quizId, answer) => {
    try {
        const response = await axiosInstance.post(API_PATHS.QUIZZES.SUBMIT_QUIZ(quizId), {answer});
        return response.data;

    } catch (error) {
        console.error("Fail to submit the quiz at the frontend due to: " + error);
        throw error;
    }
};

const getQuizResults = async (quizId) => {
    try {
        const response = await axiosInstance.get(API_PATHS.QUIZZES.GET_QUIZ_RESULT(quizId));
        return response.data;

    } catch (error) {
        console.error("Fail to get the quiz result at the frontend due to: " + error);
        throw error;
    }
};

const deleteQuiz = async (quizId) => {
    try {
        const response = await axiosInstance.get(API_PATHS.QUIZZES.DELETE_QUIZ(quizId));
        return response.data;

    } catch (error) {
        console.error("Fail to dlete the quiz at the frontend due to: " + error);
        throw error;
    }
};

const quizService = {
    getQuizzesForDocument,
    getQuizById,
    submitQuiz,
    getQuizResults,
    deleteQuiz
};

export default quizService;